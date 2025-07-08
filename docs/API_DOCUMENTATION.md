# API & Services Documentation

This document provides comprehensive documentation for all services, APIs, and data management in the UniStore application.

## 🗄️ Database Schema

### Core Tables

#### `merchants`
Stores vendor information and calculated rating summaries.

```sql
CREATE TABLE merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id text UNIQUE NOT NULL DEFAULT ('SELLER_' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  school_name text NOT NULL,
  seller_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  average_rating decimal(3,2) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  rating_breakdown jsonb DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}',
  last_matched_at timestamptz
);
```

**Key Features**:
- Auto-generated seller IDs
- Rating summary fields (updated via triggers)
- Fair visibility tracking with `last_matched_at`
- School constraint validation

#### `product_categories`
Product classification system for AI matching.

```sql
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### `merchant_categories`
Many-to-many relationship between merchants and categories.

```sql
CREATE TABLE merchant_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(merchant_id, category_id)
);
```

#### `request_logs`
Complete tracking of user product requests and AI analysis.

```sql
CREATE TABLE request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  university text NOT NULL CHECK (university IN ('Bingham', 'Veritas')),
  request_text text NOT NULL,
  matched_seller_ids text[],
  generated_categories text[],
  matched_categories text[],
  seller_categories jsonb,
  seller_ranking_order text[],
  admin_scores jsonb,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);
```

**AI Analysis Fields**:
- `generated_categories`: Categories extracted from request
- `matched_categories`: Categories found in catalog
- `seller_categories`: Categories for each matched seller
- `seller_ranking_order`: AI-determined ranking

#### `seller_ratings`
Rating and review system with cancellation support.

```sql
CREATE TABLE seller_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  request_id uuid REFERENCES request_logs(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  can_be_cancelled boolean DEFAULT true,
  is_cancelled boolean DEFAULT false,
  UNIQUE(user_id, merchant_id, request_id)
);
```

**Features**:
- One rating per user-merchant-request combination
- Soft deletion via `is_cancelled`
- Time-limited cancellation support

#### `contact_interactions`
WhatsApp contact tracking for rating prompts.

```sql
CREATE TABLE contact_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  request_id uuid REFERENCES request_logs(id) ON DELETE SET NULL,
  contacted_at timestamptz DEFAULT now(),
  rating_prompted boolean DEFAULT false,
  rating_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### `unique_visitors`
User analytics and phone authentication.

```sql
CREATE TABLE unique_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  phone_number text UNIQUE,
  first_visit timestamptz DEFAULT now(),
  last_visit timestamptz DEFAULT now(),
  visit_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
```

#### `schools`
Dynamic university configuration.

```sql
CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  short_name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

## 🤖 AI Services

### `gemini.ts` - Google AI Integration

#### Core Functions

##### `generateProductCategories(sellerDescription: string)`
Generates product categories from merchant descriptions.

**Input**: Seller description text
**Output**: 
```typescript
interface CategoryGenerationResult {
  categories: string[];
  success: boolean;
  error?: string;
}
```

**AI Prompt Strategy**:
- Requests 1-3 word categories
- Maximum 5 categories
- Title case formatting
- Specific rather than general categories

**Example**:
```typescript
const result = await generateProductCategories("I sell laptops and phone accessories");
// Returns: { categories: ["Laptops", "Phone Accessories", "Electronics"], success: true }
```

##### `generateCategoriesFromRequest(requestText: string)`
Extracts categories from user product requests.

**Purpose**: Understand what users are looking for
**Processing**: Analyzes request intent and maps to product categories
**Usage**: First step in AI-powered merchant matching

##### `findMerchantsForRequest(requestText, universityName, limit)`
Complete AI-powered merchant matching pipeline.

**Workflow**:
1. Generate categories from request
2. Find similar categories in catalog
3. Match merchants by categories
4. Apply ranking algorithm
5. Return sorted results

**Ranking Factors**:
- Category match score (exact > containment > semantic)
- Merchant rating boost
- Fair visibility (recency penalty)
- Category specialization

**Output**:
```typescript
interface MerchantMatchResult {
  merchants: MerchantWithCategories[];
  success: boolean;
  error?: string;
  generatedCategories?: string[];
  matchedCategories?: string[];
  sellerCategories?: Record<string, string[]>;
}
```

#### Category Matching Algorithm

##### Word-Based Matching
```typescript
function findSimilarCategories(generated: string[], catalog: string[]): string[] {
  // 1. Exact matches (highest priority)
  // 2. Containment matches
  // 3. Word-by-word matching
  // 4. Partial word matching (4+ characters)
}
```

##### Semantic Matching
Uses AI to find conceptually similar categories:
```typescript
async function findSimilarCategoriesWithAI(generated: string[], catalog: string[]): Promise<CategoryMatchResult> {
  // Combines word-based + AI semantic matching
  // AI provides extremely low scores for semantic matches
  // Preserves word-based match priority
}
```

#### Fair Visibility System
Ensures all merchants get equal exposure opportunities:

```typescript
function calculateCategoryMatchScore(
  merchantCategories: string[],
  requestCategories: string[],
  averageRating?: number,
  totalRatings?: number,
  lastMatchedAt?: string
): number {
  // Base score from category matching
  // Rating boost (small)
  // Recency penalty (24-hour window)
  // Specialization bonus (fewer categories = higher score)
}
```

## 📊 Service Layer

### `categoryService.ts` - Category Management

#### Core Functions

##### `processSellerCategories(sellerDescription: string)`
Complete category processing pipeline for merchants.

**Workflow**:
1. Generate categories via AI
2. Check against existing catalog
3. Insert new categories
4. Return normalized category list

**Features**:
- Duplicate prevention
- Case-insensitive matching
- Automatic catalog expansion

##### `getMerchantCategories(merchantId: string, sellerDescription: string)`
Retrieves categories for a merchant with fallback generation.

**Priority Order**:
1. Stored categories (database)
2. Generated categories (AI + storage)
3. Empty array (fallback)

##### `storeMerchantCategories(merchantId: string, categoryNames: string[])`
Creates merchant-category relationships.

**Features**:
- Upsert category creation
- Duplicate relationship prevention
- Cascade deletion support

### `ratingService.ts` - Rating System

#### Contact Tracking

##### `trackContactInteraction(merchantId: string, requestId?: string)`
Records WhatsApp contact events for rating eligibility.

**Features**:
- Duplicate contact prevention per request
- Analytics integration
- Rating prompt scheduling

##### `hasUserContactedMerchant(merchantId: string, requestId?: string)`
Verifies contact eligibility for rating submission.

#### Rating Management

##### `submitRating(merchantId: string, ratingData: RatingData, requestId?: string)`
Handles rating submission with validation.

**Validation Rules**:
1. User must have contacted merchant
2. One rating per user-merchant-request
3. Rating range: 1-5 stars
4. Optional review text

**Database Updates**:
- Insert/update rating record
- Trigger merchant summary update
- Mark contact interaction as completed

##### `getUserRating(merchantId: string, requestId?: string)`
Comprehensive rating status check.

**Returns**:
```typescript
interface RatingStatus {
  rating?: any;           // Existing rating data
  canRate: boolean;       // Can submit/update rating
  canCancel: boolean;     // Can cancel existing rating
}
```

#### Rating Prompts

##### `getContactsNeedingRatingPrompts()`
Identifies contacts eligible for rating reminders.

**Criteria**:
- 24-48 hours after contact
- No rating submitted
- No prompt sent yet
- User-specific filtering

### `schoolService.ts` - University Management

#### CRUD Operations

##### `getActiveSchools()`
Retrieves all active universities for selection.

**Error Handling**:
- Network connectivity detection
- Detailed error logging
- Graceful fallback

##### `addSchool(name: string, shortName: string)`
Creates new university entries.

**Validation**:
- Unique name constraint
- Unique short name constraint
- Automatic activation

### `merchantAnalytics.ts` - Analytics Service

#### Event Tracking

##### `trackMerchantMatch(merchantId: string, requestId: string)`
Records when merchants appear in search results.

**Updates**:
- Analytics event insertion
- Merchant `last_matched_at` timestamp
- Fair visibility tracking

##### `trackMerchantContact(merchantId: string, requestId?: string)`
Records WhatsApp contact events.

**Deduplication**: Prevents multiple tracking for same request

#### Analytics Queries

##### `getMerchantStats(merchantId: string)`
Comprehensive merchant performance metrics.

**Metrics**:
```typescript
interface MerchantStats {
  total_matches: number;
  total_contacts: number;
  match_to_contact_ratio: number;
  recent_matches: number;      // Last 30 days
  recent_contacts: number;     // Last 30 days
}
```

## 🔐 Authentication & Security

### Row Level Security (RLS)
All tables use Supabase RLS with public policies:

```sql
-- Example policy structure
CREATE POLICY "Allow public read access to merchants"
  ON merchants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to merchants"
  ON merchants
  FOR INSERT
  TO public
  WITH CHECK (true);
```

### Phone Authentication
User identification system:

```typescript
// Generate unique user ID
function generateUniqueId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Phone number authentication
async function authenticateWithPhone(phoneNumber: string): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  // Check existing phone numbers
  // Link or create user record
  // Set authentication status
}
```

### Admin Authentication
Simple username/password protection:
- Username: `bhustoreadmin`
- Password: `bhustoreadmin`
- Session storage in localStorage

## 🔄 Data Flow Patterns

### 1. Search Request Flow
```
User Input → AI Category Generation → Category Matching → 
Merchant Filtering → Ranking Algorithm → Results Display
```

### 2. Rating Flow
```
Contact Tracking → Time-based Prompt → Rating Submission → 
Merchant Summary Update → Analytics Recording
```

### 3. Merchant Registration Flow
```
Form Input → Category Generation → Validation → 
Database Insertion → Category Relationships → Success Confirmation
```

## 📈 Performance Optimizations

### Database Indexes
Strategic indexing for common queries:

```sql
-- Category matching
CREATE INDEX idx_merchant_categories_category_id ON merchant_categories(category_id);

-- Request analytics
CREATE INDEX idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX idx_request_logs_university ON request_logs(university);

-- Rating queries
CREATE INDEX idx_seller_ratings_merchant_id ON seller_ratings(merchant_id);
CREATE INDEX idx_seller_ratings_created_at ON seller_ratings(created_at);

-- Fair visibility
CREATE INDEX idx_merchants_last_matched_at ON merchants(last_matched_at);
```

### Query Optimization
- Batch category insertions
- Efficient relationship queries
- Pagination for large datasets
- Selective field fetching

### Caching Strategies
- Category catalog caching
- School list caching
- Merchant summary caching
- Analytics result caching

## 🚨 Error Handling

### Service Layer Patterns
```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Consistent error handling
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

### Database Error Handling
- Constraint violation detection
- Duplicate key handling
- Foreign key error management
- Transaction rollback support

### AI Service Error Handling
- API key validation
- Rate limiting management
- Response parsing errors
- Fallback mechanisms

This documentation provides a comprehensive reference for understanding and maintaining the API and service layer of the UniStore application.
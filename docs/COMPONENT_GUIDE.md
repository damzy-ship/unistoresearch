# Component Architecture Guide

This document provides detailed information about the component structure and organization of the UniStore application.

## 📁 File Organization Principles

### Component Size Limits
- **Maximum 200 lines per file** - When a component approaches this limit, it should be broken down into smaller, focused components
- **Single Responsibility** - Each component should have one clear purpose
- **Logical Grouping** - Related components are organized in folders

### Folder Structure
```
src/components/
├── admin/                    # Admin dashboard components
│   ├── MerchantEdit/        # Merchant editing functionality
│   │   ├── index.tsx        # Main component
│   │   ├── MerchantEditForm.tsx    # Form fields
│   │   └── CategoryManager.tsx     # Category management
│   ├── MerchantForm/        # Merchant registration
│   │   ├── index.tsx        # Main component
│   │   ├── MerchantFormFields.tsx  # Form fields
│   │   └── CategorySelection.tsx   # Category selection
│   ├── CategoriesTab.tsx    # Category management
│   ├── MerchantsTab.tsx     # Merchant listing
│   ├── OverviewTab.tsx      # Dashboard overview
│   ├── RequestsTab.tsx      # Request management
│   ├── SchoolsTab.tsx       # School management
│   ├── VisitorsTab.tsx      # Visitor analytics
│   ├── CustomAlert.tsx      # Alert dialogs
│   ├── CustomDialog.tsx     # Confirmation dialogs
│   └── LoginForm.tsx        # Admin authentication
├── FloatingWhatsApp.tsx     # WhatsApp contact button
├── PhoneAuthModal.tsx       # Phone authentication
├── RatingButton.tsx         # Rating trigger button
├── RatingModal.tsx          # Rating submission
├── RatingPrompt.tsx         # Rating reminders
├── RequestViewSimple.tsx    # Request details view
├── SellerResults.tsx        # Search results display
├── StarRating.tsx           # Rating display
├── UniversitySelector.tsx   # School selection
└── CategoryTest.tsx         # Development testing
```

## 🧩 Component Categories

### 1. Page Components
Located in `src/pages/`

#### `HomePage.tsx`
**Purpose**: Main application entry point and search interface
**Responsibilities**:
- University selection
- Product search input
- AI-powered merchant matching
- Results display coordination
- Search state management

**Key Features**:
- Form validation
- Loading states
- Error handling
- Search retry functionality
- Navigation to past requests

**State Management**:
```typescript
const [request, setRequest] = useState("");
const [university, setUniversity] = useState("Bingham");
const [showResults, setShowResults] = useState(false);
const [isSearching, setIsSearching] = useState(false);
const [matchedSellers, setMatchedSellers] = useState<MerchantWithCategories[]>([]);
```

#### `PastRequestsPage.tsx`
**Purpose**: Display user's request history
**Responsibilities**:
- Fetch user's past requests
- Search and filter functionality
- Request details modal
- Analytics summary

**Key Features**:
- Real-time search
- Request statistics
- Modal integration
- Responsive design

### 2. Admin Components
Located in `src/components/admin/`

#### `AdminDashboard.tsx`
**Purpose**: Main admin interface coordinator
**Responsibilities**:
- Authentication management
- Tab navigation
- Data fetching coordination
- State management for all admin functions

**Tab Structure**:
- Overview: Platform statistics
- Visitors: User analytics
- Requests: Search request management
- Merchants: Vendor management
- Categories: Product classification
- Schools: University configuration

#### Admin Tab Components

##### `OverviewTab.tsx`
**Purpose**: Dashboard metrics and KPIs
**Data Sources**:
- Visitor statistics
- Request analytics
- Merchant counts
- Rating summaries

**Metrics Displayed**:
```typescript
interface DashboardStats {
  totalVisitors: number;
  totalRequests: number;
  binghamRequests: number;
  veritasRequests: number;
  todayVisitors: number;
  todayRequests: number;
  totalMerchants: number;
  averageRating: number;
  totalRatings: number;
}
```

##### `MerchantsTab.tsx`
**Purpose**: Merchant management interface
**Features**:
- Advanced filtering (school, date, rating)
- Search functionality
- CRUD operations
- Bulk actions

**Filter Options**:
- School affiliation
- Registration date ranges
- Rating status
- Activity status

##### `CategoriesTab.tsx`
**Purpose**: Product category management
**Features**:
- Category CRUD operations
- Search and filter
- Usage analytics
- Bulk operations

### 3. Merchant Management Components

#### `MerchantEdit/` Folder Structure

##### `index.tsx` (Main Component)
**Purpose**: Orchestrates merchant editing workflow
**Responsibilities**:
- State management
- API calls
- Error handling
- Success/failure feedback

##### `MerchantEditForm.tsx`
**Purpose**: Basic merchant information form
**Fields**:
- Email address
- Full name
- Phone number
- School selection
- Seller description

**Validation**:
- Email format validation
- Phone number format
- Required field validation
- Duplicate email checking

##### `CategoryManager.tsx`
**Purpose**: Advanced category management
**Features**:
- Display existing categories
- AI category generation
- Manual category selection
- Category removal
- Search functionality

**Category Types**:
1. **Existing**: Currently assigned to merchant
2. **Generated**: AI-created from description
3. **Manual**: User-selected from catalog

#### `MerchantForm/` Folder Structure

##### `index.tsx` (Main Component)
**Purpose**: New merchant registration coordinator
**Workflow**:
1. Basic information collection
2. Category generation/selection
3. Data validation
4. Database insertion
5. Success confirmation

##### `MerchantFormFields.tsx`
**Purpose**: Registration form fields
**Features**:
- Real-time validation
- School dropdown population
- Phone number formatting
- Description character limits

##### `CategorySelection.tsx`
**Purpose**: Category assignment during registration
**Features**:
- AI category generation
- Manual category search
- Category preview
- Selection summary

### 4. User Interface Components

#### `StarRating.tsx`
**Purpose**: Consistent rating display across the app
**Props**:
```typescript
interface StarRatingProps {
  rating: number;
  totalRatings?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}
```

**Features**:
- Multiple size variants
- Half-star support
- Rating count display
- Customizable styling

#### `RatingModal.tsx`
**Purpose**: Rating submission interface
**Features**:
- 1-5 star selection
- Optional text review
- Rating cancellation
- Contact verification

**Validation Rules**:
- User must have contacted merchant
- One rating per user-merchant-request combination
- Rating cancellation within time limits

#### `PhoneAuthModal.tsx`
**Purpose**: User authentication for contact tracking
**Features**:
- Nigerian phone number validation
- Privacy policy explanation
- Existing user detection
- Secure storage

**Phone Number Format**:
- Enforces +234 prefix
- 10-digit validation
- Prevents leading zeros
- Real-time formatting

#### `UniversitySelector.tsx`
**Purpose**: Dynamic school selection
**Features**:
- Dropdown for multiple schools
- Button layout for 2 or fewer schools
- Search functionality
- Error handling

**Responsive Behavior**:
- ≤2 schools: Button layout
- >2 schools: Dropdown with search
- Loading states
- Error recovery

### 5. Utility Components

#### `FloatingWhatsApp.tsx`
**Purpose**: Global WhatsApp contact option
**Features**:
- Floating action button
- Tooltip display
- Modal confirmation
- Conditional visibility

#### `RatingPrompt.tsx`
**Purpose**: Automated rating reminders
**Features**:
- Time-based prompts (24-48 hours after contact)
- Dismissal handling
- Multiple contact tracking
- Modal integration

#### `SellerResults.tsx`
**Purpose**: Search results display
**Features**:
- Merchant cards
- Contact buttons
- Rating displays
- Loading states
- Empty states

## 🔄 Component Communication Patterns

### 1. Props Down, Events Up
```typescript
// Parent passes data down
<MerchantEditForm 
  merchantForm={merchantForm}
  setMerchantForm={setMerchantForm}
  schools={schools}
/>

// Child emits events up
onSuccess={() => {
  setEditingMerchant(null);
  onRefresh();
}}
```

### 2. State Management
- **Local State**: Component-specific data
- **Lifted State**: Shared between siblings
- **Context**: Global application state (minimal usage)

### 3. Service Integration
```typescript
// Service calls in components
const result = await processSellerCategories(description);
if (result.success) {
  setCategories(result.categories);
}
```

## 🎨 Styling Patterns

### 1. Tailwind CSS Classes
- Consistent spacing: `p-4`, `m-6`, `gap-3`
- Color schemes: `bg-orange-500`, `text-gray-900`
- Responsive design: `sm:`, `md:`, `lg:` prefixes

### 2. Component Variants
```typescript
const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4', 
  lg: 'w-5 h-5'
};
```

### 3. Interactive States
- Hover effects: `hover:bg-gray-50`
- Focus states: `focus:ring-2 focus:ring-orange-500`
- Disabled states: `disabled:opacity-50`

## 🔧 Development Guidelines

### 1. Component Creation Checklist
- [ ] Single responsibility principle
- [ ] Under 200 lines
- [ ] TypeScript interfaces
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Accessibility features

### 2. Refactoring Triggers
- Component exceeds 200 lines
- Multiple responsibilities
- Repeated code patterns
- Complex state management
- Difficult testing

### 3. Testing Considerations
- Component isolation
- Props validation
- Event handling
- Error scenarios
- Loading states
- Responsive behavior

## 📚 Best Practices

### 1. Component Design
- Start with the simplest implementation
- Add complexity gradually
- Prefer composition over inheritance
- Use TypeScript for type safety

### 2. Performance
- Lazy load heavy components
- Memoize expensive calculations
- Optimize re-renders
- Use proper key props

### 3. Maintainability
- Clear naming conventions
- Comprehensive documentation
- Consistent code style
- Regular refactoring

This guide serves as a reference for understanding and maintaining the component architecture of the UniStore application.
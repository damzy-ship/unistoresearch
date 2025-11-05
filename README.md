# UniStore - University Marketplace

UniStore is a comprehensive marketplace platform that connects university students with local vendors and suppliers. The platform uses AI-powered matching to help students find products and services from verified merchants within their university ecosystem.

## 🌟 Recent Updates

- **Enhanced Billing Management**: Advanced billing date system with relative date setting
- **Active/Inactive Status**: Real-time seller status based on billing dates
- **Improved Search**: Search by seller ID across all interfaces
- **Professional Landing Page**: Elegant marketing page at `/landing-page`
- **Enhanced Admin Tools**: Better filtering and management capabilities

## 🚀 Features

### Core Functionality
- **AI-Powered Product Matching**: Uses Google Gemini AI to match student requests with relevant merchants
- **Multi-University Support**: Currently supports Bingham University and Veritas University
- **WhatsApp Integration**: Direct communication between students and merchants
- **Rating & Review System**: Students can rate their experiences with merchants
- **Request Tracking**: Complete history of all product requests and matches
- **Seller Status Management**: Active/inactive status based on billing dates
- **Advanced Search**: Search by seller ID, name, categories, and more

### Admin Dashboard
- **Merchant Management**: Add, edit, and manage merchant profiles
- **Category Management**: AI-generated and manual product categories
- **Analytics**: Comprehensive tracking of user interactions and merchant performance
- **Request Monitoring**: View and score all student requests
- **School Management**: Dynamic university configuration
- **Billing Management**: Set and track seller billing dates
- **Status Filtering**: Filter sellers by active/inactive status

### User Experience
- **Phone Authentication**: Secure user identification for contact tracking
- **Past Requests**: Users can view their complete request history
- **Rating Prompts**: Automated prompts for rating merchants after contact
- **Responsive Design**: Optimized for mobile and desktop use
- **Public Seller Directory**: Browse all sellers with filtering options
- **Seller Profile Cards**: Beautiful FIFA-style seller cards

### Public Pages
- **Landing Page**: Professional marketing page (`/landing-page`)
- **Sellers Directory**: Public catalog of all sellers (`/sellers`)
- **Seller Cards**: Shareable seller profile cards (`/seller-card/:sellerId`)
- **Seller Details**: Comprehensive seller profiles (`/seller/:sellerId`)

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin dashboard components
│   │   ├── MerchantEdit/    # Merchant editing components
│   │   │   ├── BillingDateManager.tsx  # Advanced billing management
│   │   ├── MerchantForm/    # Merchant registration components
│   │   └── ...
│   ├── StarRating.tsx   # Rating display component
│   ├── RatingModal.tsx  # Rating submission modal
│   └── ...
├── pages/               # Main application pages
│   ├── HomePage.tsx     # Main search interface
│   ├── PastRequestsPage.tsx # User request history
│   ├── LandingPage.tsx  # Marketing landing page
│   ├── SellersPage.tsx  # Public seller directory
│   ├── SellerCardPage.tsx   # Individual seller cards
│   ├── SellerDetailsPage.tsx # Seller profile pages
│   └── ...
├── lib/                 # Core business logic
│   ├── supabase.ts      # Database client and types
│   ├── gemini.ts        # AI integration
│   ├── categoryService.ts # Category management
│   ├── ratingService.ts # Rating system
│   └── ...
└── hooks/               # Custom React hooks
    └── useTracking.ts   # User tracking and analytics
```

### Database Schema
The application uses Supabase with the following key tables:
- `merchants` - Vendor information and ratings
- `product_categories` - Product classification system
- `merchant_categories` - Many-to-many relationship
- `request_logs` - Student product requests
- `seller_ratings` - Rating and review system
- `contact_interactions` - WhatsApp contact tracking
- `unique_visitors` - User analytics
- `schools` - University configuration

### Recent Schema Updates
- Added `billing_date` and `is_billing_active` columns to `merchants` table
- Enhanced indexes for better performance
- Seller status determination based on billing dates

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Vite** for build tooling

### Backend & Services
- **Supabase** for database and real-time features
- **Google Gemini AI** for intelligent product matching
- **WhatsApp Business API** for merchant communication
- **Netlify** for deployment

### Key Libraries
- `@supabase/supabase-js` - Database client
- `@google/generative-ai` - AI integration
- `react-router-dom` - Client-side routing

## 🎨 New Features Detail

### Billing Management System
- **Manual Date Selection**: Pick specific billing due dates
- **Relative Date Setting**: Set dates relative to current date (e.g., "30 days from now")
- **Status Automation**: Sellers automatically become inactive when billing is due
- **Search Exclusion**: Inactive sellers are excluded from AI matching

### Enhanced Seller Profiles
- **Seller ID Display**: Unique identifiers shown across all interfaces
- **Status Badges**: Visual indicators for active/inactive status
- **Professional Cards**: FIFA-style animated seller cards
- **Comprehensive Details**: Full seller profile pages with statistics

### Public Seller Directory
- **Filterable Catalog**: Search and filter by university, categories
- **Share Functionality**: Share individual seller profiles
- **Responsive Design**: Optimized for all device sizes
- **Status Indicators**: Clear active/inactive status display

### Landing Page
- **Professional Design**: Modern, gradient-rich design
- **Feature Showcase**: Highlight key platform benefits
- **Statistics Display**: Platform usage metrics
- **Call-to-Action**: Multiple entry points to the platform

## 📱 Component Documentation

### Core Components

#### `HomePage.tsx`
The main landing page and search interface.
- **Purpose**: Primary user entry point for product searches
- **Features**: University selection, AI-powered search, results display
- **State Management**: Handles search state, results, and loading states
- **Integration**: Uses Gemini AI for merchant matching

#### `AdminDashboard.tsx`
#### `LandingPage.tsx`
Professional marketing landing page.
- **Purpose**: Showcase platform features and benefits
- **Features**: Hero section, statistics, feature highlights, how-it-works
- **Design**: Modern responsive design with animations
- **Navigation**: Multiple paths to main application features

#### `SellersPage.tsx`
Public directory of all sellers.
- **Purpose**: Browse and discover sellers
- **Features**: Search, filtering, status indicators, sharing
- **Responsive**: Optimized grid layout for all screen sizes
- **Integration**: Real-time status calculation and display

#### `SellerCardPage.tsx`
Individual seller profile cards.
- **Purpose**: Shareable seller profiles
- **Design**: FIFA-style animated cards with gradients
- **Features**: Status badges, statistics, call-to-action
- **Responsive**: Centered design with mobile optimization

#### `SellerDetailsPage.tsx`
Comprehensive seller profile pages.
- **Purpose**: Detailed seller information and reviews
- **Features**: Full statistics, review display, category showcase
- **Layout**: Sidebar layout with main content area
- **Integration**: Real-time data from multiple sources

Comprehensive admin interface for platform management.
- **Purpose**: Administrative control panel
- **Features**: Multi-tab interface for different admin functions
- **Authentication**: Simple username/password protection
- **Tabs**: Overview, Visitors, Requests, Merchants, Categories, Schools

### New Admin Components

#### `BillingDateManager.tsx`
Advanced billing date management component.
- **Purpose**: Set and manage seller billing dates
- **Features**: Manual and relative date modes, real-time calculation
- **Integration**: Used in both merchant creation and editing
- **Validation**: Proper date validation and user feedback

#### `MerchantEdit/index.tsx`
Merchant profile editing interface.
- **Purpose**: Update merchant information and categories
- **Components**: 
  - `MerchantEditForm.tsx` - Basic information fields
  - `CategoryManager.tsx` - Category assignment and management
  - `BillingDateManager.tsx` - Billing date management
- **Features**: AI category generation, manual category selection

#### `MerchantForm/index.tsx`
New merchant registration interface.
- **Purpose**: Register new merchants on the platform
- **Components**:
  - `MerchantFormFields.tsx` - Basic registration fields
  - `CategorySelection.tsx` - Category assignment during registration
  - `BillingDateManager.tsx` - Billing date setup
- **Features**: Form validation, category generation, school selection

### Utility Components

#### `StarRating.tsx`
Reusable rating display component.
- **Props**: `rating`, `totalRatings`, `size`, `showCount`
- **Features**: Visual star display, rating statistics
- **Usage**: Used throughout the app for displaying merchant ratings

#### `RatingModal.tsx`
Modal for submitting merchant ratings.
- **Purpose**: Collect user feedback on merchant interactions
- **Features**: 1-5 star rating, optional text review, rating cancellation
- **Validation**: Ensures users can only rate contacted merchants

#### `PhoneAuthModal.tsx`
User authentication modal for phone number collection.
- **Purpose**: Secure user identification for contact tracking
- **Features**: Nigerian phone number validation, privacy explanation
- **Integration**: Links with contact tracking system

### Admin Components

#### `OverviewTab.tsx`
Dashboard overview with key metrics.
- **Metrics**: Total visitors, requests, merchants, ratings
- **Visualizations**: University-specific breakdowns, daily statistics
- **Purpose**: High-level platform health monitoring

#### `MerchantsTab.tsx`
Merchant management interface.
- **Features**: Search, filtering, CRUD operations
- **Filters**: School, registration date, rating status
- **Actions**: View, edit, delete merchant profiles

#### `CategoriesTab.tsx`
Product category management.
- **Purpose**: Manage the product classification system
- **Features**: Add, edit, delete categories
- **Integration**: Used by AI matching algorithm

### Enhanced Features

#### Status Management
- **Real-time Calculation**: Status determined by billing date vs current date
- **Visual Indicators**: Consistent badge system across all interfaces
- **Search Integration**: Inactive sellers excluded from AI matching
- **Admin Filtering**: Filter sellers by active/inactive status

#### Enhanced Search
- **Multi-field Search**: Name, email, seller ID, description, categories
- **Real-time Filtering**: Instant results as user types
- **Status Filtering**: Filter by active/inactive status
- **University Filtering**: Filter by specific universities

## 🔧 Services Documentation

### `gemini.ts` - AI Integration Service
Handles all AI-powered functionality using Google Gemini.

**Key Functions:**
- `generateProductCategories()` - Generate categories from merchant descriptions
- `generateCategoriesFromRequest()` - Extract categories from user requests
- `findMerchantsForRequest()` - Complete AI-powered merchant matching
- `findSimilarCategoriesWithAI()` - Semantic category matching

**Features:**
- Semantic similarity matching
- Category normalization
- Merchant ranking with fairness algorithms
- Rating-based scoring
  - **Billing-based Exclusion**: Automatically excludes inactive sellers

**Enhanced Matching**:
- Checks billing status before including sellers in results
- Logs excluded sellers for debugging
- Maintains fair visibility while respecting billing status

### `categoryService.ts` - Category Management
Manages product categories and merchant-category relationships.

**Key Functions:**
- `processSellerCategories()` - Generate and store categories
- `getMerchantCategories()` - Retrieve merchant categories
- `storeMerchantCategories()` - Create merchant-category relationships
- `getAllCategories()` - Fetch all available categories

### `ratingService.ts` - Rating System
Handles the complete rating and review system.

**Key Functions:**
- `submitRating()` - Submit merchant ratings
- `trackContactInteraction()` - Track WhatsApp contacts
- `getContactsNeedingRatingPrompts()` - Rating reminder system
- `getUserRating()` - Check user rating status

**Features:**
- Contact verification before rating
- Rating cancellation system
- Automated rating prompts
- Duplicate prevention

### `schoolService.ts` - University Management
Manages university/school configuration.

**Key Functions:**
- `getActiveSchools()` - Fetch active universities
- `addSchool()` - Add new universities
- `updateSchool()` - Modify university settings
- `deleteSchool()` - Remove universities

### `merchantAnalytics.ts` - Enhanced Analytics
- **Billing Tracking**: Track billing-related events
- **Status Analytics**: Monitor active/inactive seller ratios
- **Performance Metrics**: Enhanced with billing status data
- **Exclusion Logging**: Track when sellers are excluded due to billing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Google AI API key

### Environment Variables
Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Installation
```bash
# Install dependencies
npm install

# Run database migrations (if using Supabase locally)
# The billing columns migration will be applied automatically

# Run development server
npm run dev

# Build for production
npm run build
```

### Supabase Redirect URLs (Important for Password Reset)

1. In your Supabase Dashboard go to Authentication → URL Configuration.
2. Set your "Site URL" to your app base URL (for local dev this might be http://localhost:5173).
3. Add the full password-reset redirect URL to "Additional Redirect URLs":

  - For local development: http://localhost:5173/update-password
  - For production: https://your-production-url.com/update-password

4. This must match exactly the URL supplied to `supabase.auth.resetPasswordForEmail(..., { redirectTo })`.

Without this configuration, the password recovery flow will fail to redirect back into the app.


### Database Setup
1. Create a Supabase project
2. Run the migrations in `supabase/migrations/`
3. Configure Row Level Security policies
4. Set up the database schema
5. The latest migration includes billing date columns
6. Ensure proper indexes are created for performance

## 📊 Analytics & Tracking

### User Analytics
- **Unique Visitors**: Tracked by generated user IDs
- **Request Logs**: Complete history of all searches
- **Contact Interactions**: WhatsApp contact tracking
- **Rating Analytics**: Merchant performance metrics
- **Billing Analytics**: Track active/inactive seller ratios
- **Exclusion Tracking**: Monitor sellers excluded due to billing

### Merchant Analytics
- **Profile Matches**: How often merchants appear in results
- **Contact Rate**: Percentage of matches that lead to contact
- **Rating Performance**: Average ratings and review counts
- **Fair Visibility**: Rotation system for equal exposure
- **Billing Status**: Track billing compliance
- **Activity Metrics**: Monitor active vs inactive periods

### Admin Insights
- **University Breakdown**: Request distribution by school
- **Category Performance**: Most requested product types
- **Merchant Success**: Top-performing vendors
- **User Engagement**: Contact and rating patterns
- **Billing Compliance**: Track billing date adherence
- **Status Distribution**: Active vs inactive seller ratios

## 🔒 Security & Privacy

### Data Protection
- Row Level Security (RLS) on all database tables
- Phone number encryption and secure storage
- User anonymization through generated IDs
- GDPR-compliant data handling
- Secure billing date management
- Protected admin billing controls

### Authentication
- Admin dashboard protection
- Phone-based user verification
- Session management
- Secure API key handling
- Admin-only billing management access
- Protected seller status controls

## 🚀 Deployment

The application is deployed on Netlify with:
- Automatic builds from Git
- Environment variable management
- CDN distribution
- SSL certificates

### Deployment URL
Production: https://elegant-cannoli-d5b2bf.netlify.app

### New Routes
- `/landing-page` - Professional marketing page
- `/sellers` - Public seller directory
- `/seller-card/:sellerId` - Individual seller cards
- `/seller/:sellerId` - Comprehensive seller profiles

## 🤝 Contributing

### Code Organization
- Keep components under 200 lines
- Use TypeScript for type safety
- Follow the established folder structure
- Document all public functions
- Maintain consistent status badge styling
- Follow billing date validation patterns

### Best Practices
- Responsive design first
- Accessibility compliance
- Performance optimization
- Error handling and user feedback
- Consistent status indicator usage
- Proper billing date handling

## 📝 License

This project is proprietary software developed for university marketplace operations.

## 📞 Support

For technical support or feature requests, contact the development team through the admin dashboard or WhatsApp integration.
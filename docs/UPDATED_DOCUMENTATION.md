# UniStore - Updated Documentation

## Recent Updates & New Features

### 1. Seller ID Display
- **Location**: All seller profiles, cards, and admin sections
- **Implementation**: Seller IDs are now prominently displayed in:
  - Public seller directory cards
  - Seller profile cards (FIFA-style)
  - Seller details pages
  - Admin merchant management
  - Admin merchant view modal

### 2. Enhanced Search Functionality
- **Admin Sellers Page**: Can now search by seller ID in addition to name, email, and description
- **Public Sellers Directory**: Search includes seller ID, name, categories, and description
- **Implementation**: Updated filter logic to include seller_id in search queries

### 3. Advanced Billing Date Management
- **New Component**: `BillingDateManager.tsx`
- **Features**:
  - Manual date selection
  - Relative date setting (days, weeks, months from current date)
  - Toggle between manual and relative modes
  - Real-time date calculation and display
- **Integration**: Used in both merchant creation and editing forms

### 4. Active/Inactive Status System
- **Logic**: Sellers are inactive if billing date is due and billing system is active
- **Display**: Status badges shown across all seller interfaces
- **Icons**: 
  - Active: Green badge with CheckCircle icon
  - Inactive: Red badge with AlertCircle icon
- **Filtering**: Admin can filter by active/inactive status

### 5. Billing Due Date Column
- **Admin Merchants Table**: New column showing billing due dates
- **Color Coding**: 
  - Green for future dates (active)
  - Red for past dates (inactive)
  - Gray for unset dates
- **Sorting**: Can sort by billing date

### 6. Enhanced Admin Filters
- **New Filter**: Status filter (Active/Inactive)
- **Updated Layout**: 6-column grid to accommodate new filter
- **Filter Count**: Updated to include status filter in active count

### 7. Seller Exclusion from Search
- **Implementation**: Modified `findMerchantsByCategories` in `gemini.ts`
- **Logic**: Sellers with due billing dates are automatically excluded from AI matching
- **Logging**: Console logs when sellers are skipped due to billing

### 8. Elegant Landing Page
- **Route**: `/landing-page`
- **Features**:
  - Hero section with gradient backgrounds
  - Statistics showcase
  - Feature highlights
  - How it works section
  - Call-to-action sections
  - Professional footer
- **Design**: Modern, responsive design with animations and gradients

### 9. Preserved Seller Ranking Order
- **Implementation**: Updated all request viewing components
- **Logic**: Uses `seller_ranking_order` from request data to maintain AI-determined order
- **Fallback**: Falls back to `matched_seller_ids` order if ranking order unavailable

## Updated File Structure

### New Files
```
src/
├── components/admin/MerchantEdit/
│   └── BillingDateManager.tsx          # Advanced billing date management
├── pages/
│   └── LandingPage.tsx                 # Elegant landing page
└── docs/
    └── UPDATED_DOCUMENTATION.md       # This documentation
```

### Modified Files
- `src/components/admin/MerchantsTab.tsx` - Added status filter and billing column
- `src/components/admin/MerchantView.tsx` - Added seller ID display
- `src/components/admin/MerchantEdit/MerchantEditForm.tsx` - Integrated BillingDateManager
- `src/components/admin/MerchantForm/MerchantFormFields.tsx` - Integrated BillingDateManager
- `src/pages/SellersPage.tsx` - Added seller ID and status badges
- `src/pages/SellerCardPage.tsx` - Added seller ID and status badges
- `src/pages/SellerDetailsPage.tsx` - Added seller ID and status information
- `src/lib/gemini.ts` - Added billing date exclusion logic
- `src/App.tsx` - Added landing page route

## Database Schema Updates

### New Columns in `merchants` table
- `billing_date` (date) - When seller's billing is due
- `is_billing_active` (boolean) - Whether billing system is enabled for seller

### Migration File
- `supabase/migrations/20250627145749_warm_shape.sql` - Adds billing columns and indexes

## Component Architecture Updates

### BillingDateManager Component
```typescript
interface BillingDateManagerProps {
  billingDate: string;
  isBillingActive: boolean;
  onBillingDateChange: (date: string) => void;
  onBillingActiveChange: (active: boolean) => void;
}
```

**Features**:
- Toggle between manual and relative date modes
- Relative date calculation (days/weeks/months from now)
- Real-time date preview
- Integrated billing system toggle

### Status Badge System
**Active Status**:
```jsx
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
  <CheckCircle className="w-3 h-3 mr-1" />
  Active
</span>
```

**Inactive Status**:
```jsx
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
  <AlertCircle className="w-3 h-3 mr-1" />
  Inactive
</span>
```

## API Integration Updates

### Seller Exclusion Logic
```typescript
// Skip merchants with due billing dates
if (merchant.billing_date && merchant.billing_date <= currentDate && merchant.is_billing_active) {
  console.log(`Skipping merchant ${merchant.full_name} due to billing date: ${merchant.billing_date}`);
  return;
}
```

### Enhanced Search Queries
```typescript
const matchesSearch = !searchTerm || 
  merchant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  merchant.seller_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
  merchant.seller_description.toLowerCase().includes(searchTerm.toLowerCase());
```

## User Experience Improvements

### 1. Visual Consistency
- Consistent status badges across all interfaces
- Uniform seller ID display formatting
- Cohesive color scheme for active/inactive states

### 2. Enhanced Filtering
- More granular control in admin interface
- Clear visual indicators for filter states
- Improved search capabilities

### 3. Professional Landing Page
- Modern design with gradients and animations
- Clear value proposition
- Multiple call-to-action points
- Responsive design for all devices

### 4. Improved Admin Experience
- Better billing management workflow
- Clear visibility into seller status
- Enhanced search and filtering capabilities

## Technical Implementation Notes

### 1. Date Handling
- All dates stored in ISO format (YYYY-MM-DD)
- Client-side date calculations for relative dates
- Timezone-aware comparisons for status determination

### 2. Performance Optimizations
- Database indexes on billing_date and is_billing_active columns
- Efficient filtering logic in frontend
- Minimal re-renders with proper state management

### 3. Error Handling
- Graceful fallbacks for missing billing data
- Proper validation for date inputs
- User-friendly error messages

## Future Enhancements

### Potential Improvements
1. **Automated Billing Reminders**: Email/SMS notifications for due dates
2. **Bulk Billing Operations**: Admin tools for managing multiple sellers
3. **Payment Integration**: Direct payment processing for billing
4. **Advanced Analytics**: Billing performance metrics
5. **Seller Dashboard**: Self-service billing management for sellers

### Scalability Considerations
1. **Database Partitioning**: For large numbers of sellers
2. **Caching Strategy**: For frequently accessed seller data
3. **Background Jobs**: For automated status updates
4. **API Rate Limiting**: For search and filtering operations

This documentation reflects all recent updates and provides a comprehensive overview of the new features and improvements made to the UniStore platform.
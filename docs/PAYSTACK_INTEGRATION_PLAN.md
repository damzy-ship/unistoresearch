# Paystack Billing Integration Plan for UniStore

## Overview
This plan outlines the integration of Paystack payment processing to automate seller billing management in the UniStore platform. Sellers will be able to pay their dues through Paystack, and their billing status will be automatically updated upon successful payment.

## Prerequisites Checklist

### 1. Paystack Account Setup
- [ ] Create Paystack business account
- [ ] Complete business verification
- [ ] Obtain API keys (Public and Secret)
- [ ] Configure webhook URL in Paystack dashboard

### 2. Environment Setup
- [ ] Add Paystack API keys to environment variables
- [ ] Ensure HTTPS is enabled for production
- [ ] Set up webhook endpoint for payment verification

## Database Schema Updates

### 1. New Tables

#### `billing_transactions`
```sql
CREATE TABLE billing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  paystack_reference text UNIQUE NOT NULL,
  amount integer NOT NULL, -- Amount in kobo (Paystack's smallest unit)
  currency text DEFAULT 'NGN',
  status text NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'abandoned')),
  payment_date timestamptz,
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `billing_plans`
```sql
CREATE TABLE billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount integer NOT NULL, -- Amount in kobo
  currency text DEFAULT 'NGN',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 2. Updated Tables

#### Add to `merchants` table:
```sql
ALTER TABLE merchants ADD COLUMN billing_plan_id uuid REFERENCES billing_plans(id);
ALTER TABLE merchants ADD COLUMN next_billing_date date;
ALTER TABLE merchants ADD COLUMN billing_status text DEFAULT 'active' CHECK (billing_status IN ('active', 'overdue', 'suspended'));
```

## Implementation Components

### 1. Frontend Components

#### `BillingDashboard.tsx`
- Display current billing status
- Show payment history
- Initiate new payments
- View billing plan details

#### `PaymentModal.tsx`
- Paystack payment form integration
- Handle payment initialization
- Show payment status updates

#### `BillingHistory.tsx`
- List all past transactions
- Filter by date/status
- Download receipts

### 2. Backend Services

#### `paystackService.ts`
```typescript
interface PaystackService {
  initializePayment(data: PaymentInitData): Promise<PaymentResponse>;
  verifyPayment(reference: string): Promise<VerificationResponse>;
  createCustomer(customerData: CustomerData): Promise<CustomerResponse>;
  listTransactions(params: TransactionParams): Promise<TransactionList>;
}
```

#### `billingService.ts`
```typescript
interface BillingService {
  calculateBillingAmount(merchantId: string): Promise<number>;
  createBillingTransaction(data: BillingTransactionData): Promise<Transaction>;
  updateMerchantBillingStatus(merchantId: string, status: string): Promise<void>;
  generateBillingInvoice(merchantId: string): Promise<Invoice>;
}
```

### 3. Supabase Edge Functions

#### `initialize-payment`
- Validate merchant billing requirements
- Calculate payment amount
- Initialize Paystack transaction
- Store transaction record

#### `payment-webhook`
- Verify webhook signature
- Process payment status updates
- Update merchant billing status
- Send confirmation notifications

#### `verify-payment`
- Manual payment verification
- Fallback for webhook failures
- Admin verification tools

## Integration Flow

### 1. Payment Initialization Flow
```
1. Merchant clicks "Pay Now" in billing dashboard
2. Frontend calls initialize-payment edge function
3. Edge function:
   - Validates merchant eligibility
   - Calculates billing amount
   - Creates Paystack transaction
   - Stores transaction record
   - Returns payment URL
4. Frontend redirects to Paystack payment page
5. User completes payment on Paystack
6. Paystack redirects back to success/failure page
```

### 2. Webhook Processing Flow
```
1. Paystack sends webhook to /payment-webhook endpoint
2. Edge function:
   - Verifies webhook signature
   - Extracts payment data
   - Updates transaction status
   - Updates merchant billing status
   - Extends billing period if successful
   - Sends confirmation email/SMS
```

### 3. Billing Status Management
```
1. Daily cron job checks for overdue payments
2. Updates merchant status to 'overdue'
3. Sends reminder notifications
4. After grace period, suspends merchant (excludes from search)
5. Upon payment, reactivates merchant immediately
```

## Security Considerations

### 1. API Key Management
- Store Paystack secret key in environment variables
- Never expose secret key to frontend
- Use public key only for frontend operations

### 2. Webhook Security
- Verify webhook signatures using Paystack's signature
- Validate webhook source IP addresses
- Implement idempotency to prevent duplicate processing

### 3. Payment Verification
- Always verify payments server-side
- Never trust frontend payment status
- Implement double verification for critical operations

## Configuration

### 1. Environment Variables
```env
# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx

# Billing Configuration
DEFAULT_BILLING_AMOUNT=500000  # 5000 NGN in kobo
BILLING_GRACE_PERIOD_DAYS=7
BILLING_REMINDER_DAYS=3
```

### 2. Billing Plans Setup
```sql
INSERT INTO billing_plans (name, amount, billing_cycle, description) VALUES
('Monthly Basic', 500000, 'monthly', 'Basic monthly plan for sellers'),
('Quarterly Standard', 1400000, 'quarterly', 'Standard quarterly plan with 7% discount'),
('Yearly Premium', 5400000, 'yearly', 'Premium yearly plan with 10% discount');
```

## Admin Features

### 1. Billing Management Dashboard
- View all merchant billing statuses
- Manual billing adjustments
- Payment verification tools
- Billing analytics and reports

### 2. Payment Monitoring
- Real-time payment notifications
- Failed payment alerts
- Revenue analytics
- Refund management

## Testing Strategy

### 1. Test Environment Setup
- Use Paystack test API keys
- Set up test webhook endpoints
- Create test merchant accounts

### 2. Test Scenarios
- Successful payment flow
- Failed payment handling
- Webhook delivery failures
- Network timeout scenarios
- Duplicate payment prevention

## Deployment Checklist

### 1. Pre-deployment
- [ ] Test all payment flows in staging
- [ ] Verify webhook endpoint accessibility
- [ ] Configure production API keys
- [ ] Set up monitoring and alerts

### 2. Post-deployment
- [ ] Monitor webhook delivery
- [ ] Verify payment processing
- [ ] Check billing status updates
- [ ] Monitor error logs

## Monitoring and Maintenance

### 1. Key Metrics
- Payment success rate
- Webhook delivery rate
- Billing compliance rate
- Revenue tracking

### 2. Error Handling
- Failed payment notifications
- Webhook retry mechanisms
- Manual intervention procedures
- Customer support integration

## Timeline Estimate

### Phase 1: Foundation (1-2 weeks)
- Database schema updates
- Basic Paystack integration
- Payment initialization

### Phase 2: Core Features (2-3 weeks)
- Webhook processing
- Billing status management
- Frontend payment interface

### Phase 3: Admin Features (1-2 weeks)
- Admin billing dashboard
- Payment monitoring tools
- Analytics and reporting

### Phase 4: Testing & Deployment (1 week)
- Comprehensive testing
- Production deployment
- Monitoring setup

## Success Criteria

1. **Automated Billing**: Merchants can pay bills through integrated Paystack interface
2. **Real-time Updates**: Billing status updates immediately upon payment
3. **Reliable Webhooks**: 99%+ webhook delivery success rate
4. **Admin Control**: Complete billing management through admin dashboard
5. **Security**: All payments processed securely with proper verification
6. **User Experience**: Smooth, intuitive payment flow for merchants

This integration will provide a complete billing solution that automates seller payment management while maintaining the existing fair visibility system based on billing status.
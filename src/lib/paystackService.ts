import { supabase } from './supabase';

// Paystack API configuration
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Types for Paystack integration
export interface PaymentInitData {
  email: string;
  amount: number; // Amount in kobo
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
    };
  };
}

export interface BillingTransactionData {
  merchant_id: string;
  amount: number;
  billing_period_start: string;
  billing_period_end: string;
  metadata?: Record<string, any>;
}

/**
 * Paystack service for handling payment operations
 */
export class PaystackService {
  private secretKey: string;
  private publicKey: string;

  constructor() {
    this.secretKey = PAYSTACK_SECRET_KEY || '';
    this.publicKey = PAYSTACK_PUBLIC_KEY || '';
    
    if (!this.secretKey || !this.publicKey) {
      console.warn('Paystack API keys not configured');
    }
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(data: PaymentInitData): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Create a billing transaction record
   */
  async createBillingTransaction(data: BillingTransactionData & { paystack_reference: string; status: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('billing_transactions')
        .insert({
          merchant_id: data.merchant_id,
          paystack_reference: data.paystack_reference,
          amount: data.amount,
          currency: 'NGN',
          status: data.status,
          billing_period_start: data.billing_period_start,
          billing_period_end: data.billing_period_end,
          metadata: data.metadata || {},
        });

      if (error) {
        console.error('Error creating billing transaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating billing transaction:', error);
      return { success: false, error: 'Failed to create billing transaction' };
    }
  }

  /**
   * Update billing transaction status
   */
  async updateBillingTransaction(reference: string, status: string, paymentData?: any): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'success' && paymentData) {
        updateData.payment_date = paymentData.paid_at;
        updateData.metadata = paymentData;
      }

      const { error } = await supabase
        .from('billing_transactions')
        .update(updateData)
        .eq('paystack_reference', reference);

      if (error) {
        console.error('Error updating billing transaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating billing transaction:', error);
      return { success: false, error: 'Failed to update billing transaction' };
    }
  }

  /**
   * Update merchant billing status
   */
  async updateMerchantBillingStatus(merchantId: string, status: 'active' | 'overdue' | 'suspended', nextBillingDate?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        billing_status: status,
      };

      if (nextBillingDate) {
        updateData.next_billing_date = nextBillingDate;
        updateData.billing_date = nextBillingDate; // Update the existing billing_date field
      }

      const { error } = await supabase
        .from('merchants')
        .update(updateData)
        .eq('id', merchantId);

      if (error) {
        console.error('Error updating merchant billing status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating merchant billing status:', error);
      return { success: false, error: 'Failed to update merchant billing status' };
    }
  }

  /**
   * Get merchant billing information
   */
  async getMerchantBilling(merchantId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('id, full_name, email, billing_date, billing_status, next_billing_date, billing_plan_id')
        .eq('id', merchantId)
        .single();

      if (error) {
        console.error('Error fetching merchant billing:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching merchant billing:', error);
      return { success: false, error: 'Failed to fetch merchant billing information' };
    }
  }

  /**
   * Get billing transactions for a merchant
   */
  async getMerchantTransactions(merchantId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching merchant transactions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching merchant transactions:', error);
      return { success: false, error: 'Failed to fetch merchant transactions' };
    }
  }

  /**
   * Calculate next billing date based on billing cycle
   */
  calculateNextBillingDate(currentDate: Date, cycle: 'monthly' | 'quarterly' | 'yearly'): string {
    const nextDate = new Date(currentDate);
    
    switch (cycle) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Generate payment reference
   */
  generatePaymentReference(merchantId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `UNISTORE_${merchantId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '').update(payload).digest('hex');
    return hash === signature;
  }
}

// Export singleton instance
export const paystackService = new PaystackService();
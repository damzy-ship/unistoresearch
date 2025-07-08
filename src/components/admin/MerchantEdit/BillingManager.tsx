import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { paystackService } from '../../../lib/paystackService';

interface BillingManagerProps {
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
}

interface BillingPlan {
  id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  description: string;
}

interface BillingTransaction {
  id: string;
  paystack_reference: string;
  amount: number;
  status: string;
  payment_date: string;
  created_at: string;
}

export default function BillingManager({ merchantId, merchantName, merchantEmail }: BillingManagerProps) {
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    fetchBillingData();
  }, [merchantId]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // Fetch merchant billing info
      const billingResult = await paystackService.getMerchantBilling(merchantId);
      if (billingResult.success) {
        setBillingInfo(billingResult.data);
      }

      // Fetch billing plans
      const { data: plans } = await import('../../../lib/supabase').then(({ supabase }) =>
        supabase.from('billing_plans').select('*').eq('is_active', true).order('amount')
      );
      if (plans) {
        setBillingPlans(plans);
        if (!selectedPlan && plans.length > 0) {
          setSelectedPlan(plans[0].id);
        }
      }

      // Fetch transactions
      const transactionResult = await paystackService.getMerchantTransactions(merchantId);
      if (transactionResult.success) {
        setTransactions(transactionResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;

    setProcessingPayment(true);
    try {
      // Call the initialize-payment edge function
      const response = await fetch('/functions/v1/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          billing_plan_id: selectedPlan,
        }),
      });

      const result = await response.json();

      if (result.success && result.data.authorization_url) {
        // Redirect to Paystack payment page
        window.open(result.data.authorization_url, '_blank');
        
        // Refresh billing data after a short delay
        setTimeout(() => {
          fetchBillingData();
        }, 2000);
      } else {
        alert('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Error initiating payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-medium text-blue-800">Billing Management</h4>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-medium text-blue-800">Billing Management</h4>
      </div>

      {/* Current Billing Status */}
      {billingInfo && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900">Current Status</h5>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(billingInfo.billing_status)}`}>
              {billingInfo.billing_status?.charAt(0).toUpperCase() + billingInfo.billing_status?.slice(1)}
            </span>
          </div>
          
          {billingInfo.next_billing_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Next billing: {formatDate(billingInfo.next_billing_date)}</span>
            </div>
          )}
        </div>
      )}

      {/* Billing Plans */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h5 className="font-medium text-gray-900 mb-3">Select Billing Plan</h5>
        <div className="space-y-2">
          {billingPlans.length > 0 ? billingPlans.map((plan) => (
            <label key={plan.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="billing_plan"
                value={plan.id}
                checked={selectedPlan === plan.id}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{plan.name}</span>
                  <span className="font-bold text-blue-600">{formatCurrency(plan.amount)}</span>
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
            </label>
          )) : (
            <div className="p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Monthly Standard</span>
                <span className="font-bold text-blue-600">₦1,000.00</span>
              </div>
              <p className="text-sm text-gray-600">Standard monthly plan for sellers</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Button */}
      <div className="mb-4">
        <button
          onClick={handleInitiatePayment}
          disabled={processingPayment || !selectedPlan}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingPayment ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Pay with Paystack
            </>
          )}
        </button>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">Recent Transactions</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(transaction.payment_date || transaction.created_at)}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
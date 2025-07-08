import React, { useState, useEffect } from 'react';
import { X, CreditCard, Phone, AlertCircle, CheckCircle, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SellerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
}

interface BillingPlan {
  id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  description: string;
}

export default function SellerPaymentModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  sellerEmail: initialEmail
}: SellerPaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('+234');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [sellerEmail, setSellerEmail] = useState<string | undefined>(initialEmail);

  useEffect(() => {
    if (isOpen) {
      fetchBillingData();
    }
  }, [isOpen]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      console.log("Fetching data for seller ID:", sellerId);
      console.log("Initial email value:", initialEmail);
      
      // Fetch merchant details including email
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (merchantError) {
        console.error('Error fetching merchant details:', merchantError);
      } else {
        console.log("Merchant data from database:", merchantData);
        // Update seller email if available from database
        if (merchantData && merchantData.email) {
          setSellerEmail(merchantData.email);
          console.log("Setting email to:", merchantData.email);
        }
      }
      
      // Fetch billing plans
      const { data: plans, error: plansError } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('amount');
      
      console.log("Billing plans:", plans, "Error:", plansError);
      
      if (plans && plans.length > 0) {
        setBillingPlans(plans);
        setSelectedPlan(plans[0].id);
      } else {
        // Default plan if none found
        setBillingPlans([{
          id: 'default',
          name: 'Monthly Standard',
          amount: 100000,
          billing_cycle: 'monthly',
          description: 'Standard monthly plan for sellers'
        }]);
        setSelectedPlan('default');
      }

      // Fetch merchant billing info
      const { data: merchant, error: billingError } = await supabase
        .from('merchants')
        .select('billing_date, billing_status, next_billing_date, billing_plan_id')
        .eq('id', sellerId)
        .single();
      
      console.log("Billing info:", merchant, "Error:", billingError);
      
      if (!billingError && merchant) {
        setBillingInfo(merchant);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure it always starts with +234
    if (!value.startsWith('+234')) {
      value = '+234';
    }
    
    // Remove any non-digit characters except the + at the beginning
    value = '+234' + value.slice(4).replace(/\D/g, '');
    
    // Limit to +234 + 10 digits
    if (value.length > 14) {
      value = value.slice(0, 14);
    }
    
    // Ensure the first digit after +234 is not 0
    if (value.length > 4 && value[4] === '0') {
      value = '+234' + value.slice(5);
    }
    
    setPhoneNumber(value);
  };

  const handleAuthenticate = async () => {
    if (phoneNumber.length < 14) {
      setError('Please enter a complete phone number');
      return;
    }

    setAuthenticating(true);
    setError('');

    try {
      // Verify the phone number matches the seller's phone number
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('phone_number')
        .eq('id', sellerId)
        .single();

      if (merchantError) {
        throw new Error('Failed to verify seller information');
      }

      // Normalize phone numbers for comparison
      const normalizedInput = phoneNumber.replace(/\D/g, '');
      const normalizedStored = merchant.phone_number.replace(/\D/g, '');

      console.log("Phone comparison:", {
        input: normalizedInput,
        stored: normalizedStored,
        lastTenInput: normalizedInput.slice(-10),
        lastTenStored: normalizedStored.slice(-10)
      });

      if (!normalizedStored.endsWith(normalizedInput.slice(-10))) {
        setError('Phone number does not match seller records');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;

    // Check if we have a valid email
    if (!sellerEmail) {
      setError('Seller email is required for payment processing');
      return;
    }

    setProcessingPayment(true);
    setError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-payment`;
      console.log("Calling Edge Function:", apiUrl);
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        merchant_id: sellerId,
        billing_plan_id: selectedPlan
      };
      
      console.log("Payment payload:", payload);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the raw text
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Payment initialization result:", result);
      
      if (result.success && result.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.open(result.data.authorization_url, '_blank');
        
        // Close modal after opening payment page
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError(error instanceof Error ? error.message : 'Error initiating payment. Please try again.');
      setProcessingPayment(false);
    } finally {
      // Don't set processingPayment to false here if redirecting to Paystack
      // It will be set to false in the catch block if there's an error
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Seller Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                <p className="text-blue-700 font-medium">Verify Seller Identity</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Seller Information</h4>
                <p className="text-gray-700 mb-1"><span className="font-medium">Name:</span> {sellerName}</p>
                <p className="text-gray-700"><span className="font-medium">Email:</span> {sellerEmail || 'Not available'}</p>
              </div>

              <div className="p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Monthly Standard</span>
                  <span className="font-bold text-blue-600">₦1,000.00</span>
                </div>
                <p className="text-sm text-gray-600">Standard monthly plan for sellers</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAuthenticate(); }} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                    placeholder="+234 123 456 7890"
                    required
                    disabled={authenticating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the phone number registered with this seller account
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={authenticating}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={authenticating || phoneNumber.length < 14}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {authenticating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-700 font-medium">Seller Verified</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Seller Information</h4>
                <p className="text-gray-700 mb-1"><span className="font-medium">Name:</span> {sellerName}</p>
                <p className="text-gray-700"><span className="font-medium">Email:</span> {sellerEmail || 'Not available'}</p>
              </div>

              {billingInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Current Billing Status</h4>
                  <div className="flex items-center gap-2 mb-2">
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
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Select Billing Plan</h4>
                  <div className="space-y-2">
                    {billingPlans.map((plan) => (
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
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={processingPayment}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInitiatePayment}
                    disabled={processingPayment || !selectedPlan}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Pay Now
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
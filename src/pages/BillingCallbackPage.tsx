import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';

export default function BillingCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get reference from URL
        const searchParams = new URLSearchParams(location.search);
        const reference = searchParams.get('reference');

        if (!reference) {
          setStatus('failed');
          setMessage('Payment reference not found');
          return;
        }

        // Call verify-payment function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment?reference=${reference}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          if (result.status === 'success') {
            setStatus('success');
            setMessage('Payment successful! Your billing has been updated.');
          } else {
            setStatus('failed');
            setMessage(`Payment failed: ${result.message || 'Unknown error'}`);
          }

          // Set redirect URL if provided
          if (result.callback_url) {
            setRedirectUrl(result.callback_url);
          }
        } else {
          setStatus('failed');
          setMessage(result.error || 'Failed to verify payment');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setMessage('An error occurred while verifying your payment');
      }
    };

    verifyPayment();
  }, [location]);

  const handleRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            <span className="text-orange-500">uni</span>
            <span className="text-blue-800">store.</span>
          </h1>
          <p className="text-gray-600">Payment Verification</p>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
              <p className="text-gray-600 text-center">
                Please wait while we verify your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful</h2>
              <p className="text-gray-600 text-center mb-6">
                {message}
              </p>
              <button
                onClick={handleRedirect}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
              >
                Continue
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600 text-center mb-6">
                {message}
              </p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
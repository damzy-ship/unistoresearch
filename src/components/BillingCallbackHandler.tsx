import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BillingCallbackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get reference from URL
        const searchParams = new URLSearchParams(location.search);
        const reference = searchParams.get('reference');

        if (!reference) {
          console.error('Payment reference not found');
          navigate('/');
          return;
        }

        // Redirect to the callback page
        navigate(`/billing/callback?reference=${reference}`);
      } catch (error) {
        console.error('Error handling payment callback:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { X, ShieldCheck } from 'lucide-react';

export default function MerchantVerifyPrompt() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (mounted) setLoading(false);
          return;
        }

        // respect a local dismissal (24 hours)
        const dismissedUntilRaw = localStorage.getItem('merchant_verify_dismissed_until');
        if (dismissedUntilRaw) {
          const until = Number(dismissedUntilRaw);
          if (!Number.isNaN(until) && Date.now() < until) {
            if (mounted) setLoading(false);
            return;
          }
        }

        const { data: visitor, error } = await supabase
          .from('unique_visitors')
          .select('user_type, verification_status')
          .eq('auth_user_id', session.user.id)
          .single();

        if (error) {
          console.warn('Failed to fetch visitor for merchant verify prompt', error);
          if (mounted) setLoading(false);
          return;
        }

        const isMerchant = visitor?.user_type === 'merchant';
        const isUnverified = visitor?.verification_status === 'unverified';

        if (isMerchant && isUnverified) {
          if (mounted) setShouldShow(true);
        }
      } catch (err) {
        console.warn('Error checking merchant verify prompt eligibility', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    check();
    return () => { mounted = false; };
  }, []);

  if (loading || !shouldShow) return null;

  const handleVerifyNow = () => {
    // navigate to profile where verification UI exists
    navigate('/profile');
  };

  const handleRemindLater = () => {
    // dismiss for 24 hours
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('merchant_verify_dismissed_until', String(until));
    setShouldShow(false);
  };

  const handleClose = () => {
    // small dismiss (1 day)
    handleRemindLater();
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md w-full">
      <div className="rounded-2xl shadow-xl border bg-white p-4 flex items-start gap-3" style={{ borderColor: currentTheme.primary + '20' }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3 pr-3">
            <div>
              <h4 className="font-semibold text-sm">Verify your seller account</h4>
              <p className="text-xs text-gray-600">Merchants with unverified accounts must verify before 30th September or uploaded products will be removed.</p>
            </div>
            {/* <button onClick={handleClose} className="p-1 rounded-md text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button> */}
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={handleVerifyNow} className={`bg-gradient-to-r ${currentTheme.buttonGradient} text-white px-4 py-2 rounded-lg font-medium`}>Verify now</button>
            <button onClick={handleRemindLater} className="px-4 py-2 rounded-lg border">Remind me later</button>
          </div>
        </div>
      </div>
    </div>
  );
}

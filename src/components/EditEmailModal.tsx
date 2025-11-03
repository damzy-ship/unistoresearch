import { useState, useEffect } from 'react';
import { Theme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface EditEmailModalProps {
  currentEmail: string;
  onClose: () => void;
  onSave: (newEmail: string) => void;
  currentTheme: Theme;
}

export default function EditEmailModal({ currentEmail, onClose, onSave, currentTheme }: EditEmailModalProps) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendLink = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // This call triggers Supabase to send the verification/reset link to the provided email
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) throw authError;

      // Show OTP input and start countdown for resend
      setShowOtpInput(true);
      setCountdown(45);

      // Add query param to URL to control OTP state: ?showotp=true
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('showotp', 'true');
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        console.warn('Could not set showotp query param', e);
      }

      setSuccess('A verification code was sent to the new email address. Enter the 6-digit code to confirm.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to send update request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  useEffect(() => {
    // If URL has ?showotp=true, show the OTP input when modal opens
    try {
      const url = new URL(window.location.href);
      const show = url.searchParams.get('showotp');
      if (show === 'true') setShowOtpInput(true);
    } catch (e) {
      console.warn('Could not read showotp query param', e);
    }
  }, []);

  const handleVerifyOtp = async () => {
    if (!enteredOtp) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
  // Supabase typings may not include 'email_change' in the union — call verifyOtp to confirm the email change
  const { error: verifyError } = await supabase.auth.verifyOtp({ email: newEmail, token: enteredOtp, type: 'email_change' });
      if (verifyError) throw verifyError;

      // Remove showotp query param from URL
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('showotp');
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        console.warn('Could not remove showotp query param', e);
      }

      setSuccess('Email updated successfully.');

      // Notify parent to update unique_visitors table
      try {
        onSave(newEmail);
      } catch (e) {
        console.warn('onSave callback failed:', e);
      }

      // Optionally show a toast — success state is displayed in the modal

      // Close modal shortly after success
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to confirm code');
      console.warn('OTP verify error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="rounded-2xl p-8 shadow-lg max-w-lg w-full m-4 transition-all duration-300"
        style={{ backgroundColor: currentTheme.surface, color: currentTheme.text }}
      >
        <h3 className="text-2xl font-bold mb-4" style={{ color: currentTheme.primary }}>
          Change Email Address
        </h3>

        <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
          Update your email address. Supabase will send a verification/reset link to the new email.
        </p>

        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter new email address"
          className="w-full p-3 rounded-lg border focus:outline-none transition-colors duration-200"
          style={{
            backgroundColor: currentTheme.background,
            borderColor: currentTheme.textSecondary + '30',
            color: currentTheme.text,
          }}
        />

        {error && <p className="mt-2 text-red-500">{error}</p>}
        {success && <p className="mt-2 text-green-600">{success}</p>}

        {showOtpInput && (
          <div className="mt-4">
            <input
              type="text"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full p-3 rounded-lg border focus:outline-none transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.textSecondary + '30',
                color: currentTheme.text,
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              {countdown > 0 ? (
                <p style={{ color: currentTheme.textSecondary }}>Resend available in {countdown} seconds</p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendLink}
                  disabled={loading}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium transition-colors duration-200"
            style={{ backgroundColor: currentTheme.background, color: currentTheme.text }}
            disabled={loading}
          >
            Cancel
          </button>

          {!showOtpInput ? (
            <button
              onClick={handleSendLink}
              className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})` }}
              disabled={loading || !newEmail}
            >
              {loading ? 'Processing...' : 'Send Code'}
            </button>
          ) : (
            <button
              onClick={handleVerifyOtp}
              className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})` }}
              disabled={loading || enteredOtp.length < 6}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
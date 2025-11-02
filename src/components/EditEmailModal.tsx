import { useState } from 'react';
import { Theme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface EditEmailModalProps {
  currentEmail: string;
  onClose: () => void;
  currentTheme: Theme;
}

export default function EditEmailModal({ currentEmail, onClose, currentTheme }: EditEmailModalProps) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

      setSuccess('A verification/reset link has been sent to the new email address. Please check your inbox.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to send update request');
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

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium transition-colors duration-200"
            style={{ backgroundColor: currentTheme.background, color: currentTheme.text }}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleSendLink}
            className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})` }}
            disabled={loading || !newEmail}
          >
            {loading ? 'Processing...' : 'Send Reset Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
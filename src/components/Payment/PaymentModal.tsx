import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PaymentModal({ isOpen, onClose, userId }: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const paymentLink = `${baseUrl}/payment/${userId}`;
  const { currentTheme } = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: currentTheme.surface }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: currentTheme.primary + '20' }}>
          <h3 className="text-lg font-bold" style={{ color: currentTheme.text }}>Your Payment Link</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100" style={{ color: currentTheme.textSecondary }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.primary}20` }}>
            <input
              type="text"
              value={paymentLink}
              readOnly
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: currentTheme.text }}
            />
            <button
              onClick={handleCopy}
              className="p-2 rounded-md"
              title="Copy payment link"
              style={{ color: currentTheme.textSecondary }}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
            Share this link with people who want to pay you. They can use it to send payments directly to your account.
          </p>
        </div>
      </div>
    </div>
  );
}

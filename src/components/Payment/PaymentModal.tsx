import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PaymentModal({ isOpen, onClose, userId }: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const paymentLink = `${baseUrl}/payment/${userId}`;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Your Payment Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={paymentLink}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Copy payment link"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
          
          <p className="text-sm text-gray-600">
            Share this link with people who want to pay you. They can use it to send payments directly to your account.
          </p>
        </div>
      </div>
    </div>
  );
}

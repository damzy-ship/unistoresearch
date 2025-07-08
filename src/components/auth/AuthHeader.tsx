import React from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  showBack?: boolean;
  disabled?: boolean;
}

export default function AuthHeader({
  title,
  subtitle,
  onClose,
  onBack,
  showBack = false,
  disabled = false
}: AuthHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        disabled={disabled}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
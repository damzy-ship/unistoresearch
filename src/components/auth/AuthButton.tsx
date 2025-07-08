import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface AuthButtonProps {
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function AuthButton({
  type = 'button',
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  fullWidth = false
}: AuthButtonProps) {
  const baseClasses = `px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${
    fullWidth ? 'w-full' : ''
  }`;
 
  const {currentTheme} = useTheme();
  const variantClasses = {
    primary: `bg-gradient-to-r ${currentTheme.buttonGradient} ${currentTheme.buttonGradientHover} text-white`,
    secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
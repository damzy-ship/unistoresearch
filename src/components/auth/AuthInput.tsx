import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthInputProps {
  type: 'text' | 'email' | 'tel' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  maxLength?: number;
  className?: string;
  helpText?: string;
}

export default function AuthInput({
  type,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  icon,
  showPasswordToggle = false,
  maxLength,
  className = '',
  helpText
}: AuthInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className={className}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
            icon ? 'pl-10' : ''
          } ${showPasswordToggle ? 'pr-12' : ''}`}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
}
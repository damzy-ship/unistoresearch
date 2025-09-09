import React from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export default function PhoneInput({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "+234 123 456 7890"
}: PhoneInputProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Ensure it always starts with +234
    if (!inputValue.startsWith('+234')) {
      inputValue = '+234';
    }
    
    // Remove any non-digit characters except the + at the beginning
    inputValue = '+234' + inputValue.slice(4).replace(/\D/g, '');
    
    // Limit to +234 + 10 digits
    if (inputValue.length > 14) {
      inputValue = inputValue.slice(0, 14);
    }
    
    // Ensure the first digit after +234 is not 0
    if (inputValue.length > 4 && inputValue[4] === '0') {
      inputValue = '+234' + inputValue.slice(5);
    }
    
    onChange(inputValue);
  };

  return (
    <div>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors font-mono"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
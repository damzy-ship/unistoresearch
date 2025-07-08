import React from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export default function OTPInput({
  value,
  onChange,
  disabled = false,
  length = 6
}: OTPInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(inputValue);
  };

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors font-mono text-center text-lg tracking-widest"
        placeholder="000000"
        required
        disabled={disabled}
        maxLength={length}
      />
      <p className="text-xs text-gray-500 mt-1">
        Enter the {length}-digit code sent to your phone
      </p>
    </div>
  );
}
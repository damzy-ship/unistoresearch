import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeSelectorProps {
  className?: string;
}

export default function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { currentTheme, themes, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Change Theme"
      >
        <Palette className="w-4 h-4 text-orange-600" />  <span className='font-medium text-orange-600'>Select Theme</span>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {currentTheme.name}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Choose Theme</h3>
              <p className="text-xs text-gray-500 mt-1">Customize your experience</p>
            </div>
            
            <div className="p-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    changeTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-200"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                      }}
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                    </div>
                  </div>
                  {currentTheme.id === theme.id && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
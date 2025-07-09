import React from 'react';
import { Check } from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${
        isSelected 
          ? 'shadow-lg transform scale-105 ring-2 ring-offset-2' 
          : 'hover:shadow-md hover:scale-102'
      }`}
      style={{
        backgroundColor: theme.surface,
        borderColor: isSelected ? theme.primary : theme.textSecondary + '30',
        ringColor: isSelected ? theme.primary : undefined
      }}
    >
      {/* Theme Preview */}
      <div className="space-y-3 mb-4">
        {/* Header simulation */}
        <div 
          className="h-3 rounded-full"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
          }}
        />
        
        {/* Content simulation */}
        <div className="space-y-2">
          <div 
            className="h-2 rounded w-3/4"
            style={{ backgroundColor: theme.text + '40' }}
          />
          <div 
            className="h-2 rounded w-1/2"
            style={{ backgroundColor: theme.textSecondary + '40' }}
          />
        </div>

        {/* Button simulation */}
        <div 
          className="h-6 rounded-lg"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
          }}
        />
      </div>

      {/* Theme Name */}
      <div className="text-center">
        <p 
          className="font-semibold text-sm"
          style={{ color: theme.text }}
        >
          {theme.name}
        </p>
        {theme.isDark && (
          <p 
            className="text-xs mt-1"
            style={{ color: theme.textSecondary }}
          >
            Dark Mode
          </p>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div 
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: theme.primary }}
        >
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Hover Effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-200"
        style={{ backgroundColor: theme.primary }}
      />
    </button>
  );
}
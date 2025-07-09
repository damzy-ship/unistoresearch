import React, { useState } from 'react';
import { Palette, Save, RefreshCw } from 'lucide-react';
import { Theme, useTheme } from '../hooks/useTheme';

interface CustomThemeBuilderProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function CustomThemeBuilder({ currentTheme, onThemeChange }: CustomThemeBuilderProps) {
  const { generateAITheme } = useTheme();
  const [customTheme, setCustomTheme] = useState<Partial<Theme>>({
    primary: currentTheme.primary,
    secondary: currentTheme.secondary,
    accent: currentTheme.accent,
    background: currentTheme.background,
    surface: currentTheme.surface
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleColorChange = (property: keyof Theme, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const generateCompleteTheme = async () => {
    setIsGenerating(true);
    try {
      // Create a description based on selected colors
      const description = `Create a theme with primary color ${customTheme.primary}, secondary color ${customTheme.secondary}, and accent color ${customTheme.accent}. The background should be ${customTheme.background} and surface should be ${customTheme.surface}.`;
      
      const aiTheme = await generateAITheme(description);
      if (aiTheme) {
        // Override AI theme with user's selected colors
        const finalTheme: Theme = {
          ...aiTheme,
          id: 'custom',
          name: 'Custom Theme',
          primary: customTheme.primary || aiTheme.primary,
          secondary: customTheme.secondary || aiTheme.secondary,
          accent: customTheme.accent || aiTheme.accent,
          background: customTheme.background || aiTheme.background,
          surface: customTheme.surface || aiTheme.surface,
        };
        
        onThemeChange(finalTheme);
      }
    } catch (error) {
      console.error('Error generating complete theme:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToDefault = () => {
    setCustomTheme({
      primary: currentTheme.primary,
      secondary: currentTheme.secondary,
      accent: currentTheme.accent,
      background: currentTheme.background,
      surface: currentTheme.surface
    });
  };

  return (
    <div>
      <h4 
        className="text-lg font-semibold mb-6"
        style={{ color: currentTheme.text }}
      >
        Create Your Custom Theme
      </h4>

      <div className="space-y-6">
        {/* Color Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: 'primary', label: 'Primary Color', description: 'Main brand color' },
            { key: 'secondary', label: 'Secondary Color', description: 'Accent brand color' },
            { key: 'accent', label: 'Accent Color', description: 'Highlight color' },
            { key: 'background', label: 'Background Color', description: 'Main background' },
            { key: 'surface', label: 'Surface Color', description: 'Card backgrounds' }
          ].map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <label 
                className="block text-sm font-medium"
                style={{ color: currentTheme.text }}
              >
                {label}
              </label>
              <p 
                className="text-xs"
                style={{ color: currentTheme.textSecondary }}
              >
                {description}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customTheme[key as keyof Theme] as string}
                  onChange={(e) => handleColorChange(key as keyof Theme, e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 cursor-pointer"
                  style={{ borderColor: currentTheme.textSecondary + '30' }}
                />
                <input
                  type="text"
                  value={customTheme[key as keyof Theme] as string}
                  onChange={(e) => handleColorChange(key as keyof Theme, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.textSecondary + '30',
                    color: currentTheme.text
                  }}
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div 
          className="p-6 rounded-xl border-2"
          style={{
            backgroundColor: customTheme.surface || currentTheme.surface,
            borderColor: customTheme.primary || currentTheme.primary
          }}
        >
          <h5 
            className="text-lg font-semibold mb-4"
            style={{ color: customTheme.primary || currentTheme.primary }}
          >
            Theme Preview
          </h5>
          <div className="space-y-3">
            <div 
              className="h-4 rounded"
              style={{ 
                background: `linear-gradient(135deg, ${customTheme.primary || currentTheme.primary}, ${customTheme.secondary || currentTheme.secondary})`
              }}
            />
            <div 
              className="h-3 rounded w-3/4"
              style={{ backgroundColor: (customTheme.primary || currentTheme.primary) + '40' }}
            />
            <div 
              className="h-3 rounded w-1/2"
              style={{ backgroundColor: (customTheme.accent || currentTheme.accent) + '40' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={generateCompleteTheme}
            disabled={isGenerating}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${currentTheme.buttonGradient} text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4" />
                Generate Complete Theme
              </>
            )}
          </button>
          
          <button
            onClick={resetToDefault}
            className="px-6 py-3 border border-gray-300 rounded-xl font-medium transition-colors hover:bg-gray-50"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.textSecondary + '30',
              color: currentTheme.text
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>

        <div 
          className="text-sm p-4 rounded-lg"
          style={{ 
            backgroundColor: currentTheme.primary + '10',
            color: currentTheme.text
          }}
        >
          <strong>How it works:</strong> Select your preferred colors above, then click "Generate Complete Theme" to let AI create a harmonious theme with proper text colors, gradients, and contrast ratios.
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Sparkles, Send, RefreshCw } from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface AIThemeGeneratorProps {
  onThemeGenerated: (description: string) => Promise<Theme | null>;
  currentTheme: Theme;
}

export default function AIThemeGenerator({ onThemeGenerated, currentTheme }: AIThemeGeneratorProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTheme, setGeneratedTheme] = useState<Theme | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a theme description');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const theme = await onThemeGenerated(description);
      if (theme) {
        setGeneratedTheme(theme);
      } else {
        setError('Failed to generate theme. Please try again with a different description.');
      }
    } catch (error) {
      console.error('AI Theme Generation Error:', error);
      setError('An error occurred while generating the theme. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryAgain = () => {
    setGeneratedTheme(null);
    setError('');
  };

  const examplePrompts = [
    "A warm sunset theme with orange and pink colors",
    "Dark cyberpunk theme with neon green accents", 
    "Minimalist theme inspired by Japanese zen gardens",
    "Ocean-inspired theme with blues and teals",
    "Autumn forest theme with warm browns and golds"
  ];

  return (
    <div>
      <h4 
        className="text-lg font-semibold mb-6"
        style={{ color: currentTheme.text }}
      >
        AI Theme Generator
      </h4>

      <div className="space-y-6">
        {/* Description Input */}
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: currentTheme.text }}
          >
            Describe your ideal theme
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl resize-none transition-colors focus:ring-2 focus:border-transparent"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.textSecondary + '30',
              color: currentTheme.text,
              focusRingColor: currentTheme.primary
            }}
            rows={3}
            placeholder="e.g., A vibrant theme inspired by tropical sunsets with warm oranges and deep purples..."
            maxLength={200}
          />
          <div className="flex justify-between items-center mt-2">
            <p 
              className="text-xs"
              style={{ color: currentTheme.textSecondary }}
            >
              {description.length}/200 characters
            </p>
          </div>
        </div>

        {/* Example Prompts */}
        <div>
          <p 
            className="text-sm font-medium mb-3"
            style={{ color: currentTheme.text }}
          >
            Try these examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setDescription(prompt)}
                className="px-3 py-2 text-xs rounded-lg border transition-colors hover:shadow-sm"
                style={{
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.textSecondary + '30',
                  color: currentTheme.textSecondary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.primary + '10';
                  e.currentTarget.style.color = currentTheme.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.surface;
                  e.currentTarget.style.color = currentTheme.textSecondary;
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${currentTheme.buttonGradient} text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 hover:shadow-lg transform hover:scale-105`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Theme...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Theme
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: '#fef2f2',
              borderColor: '#fecaca',
              color: '#dc2626'
            }}
          >
            <p className="text-sm font-medium">⚠️ {error}</p>
            <p className="text-xs mt-1">Try being more specific about colors, mood, or inspiration.</p>
          </div>
        )}

        {/* Generated Theme Preview */}
        {generatedTheme && (
          <div 
            className="p-6 rounded-xl border-2 shadow-lg"
            style={{
              backgroundColor: generatedTheme.surface,
              borderColor: generatedTheme.primary
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h5 
                className="text-lg font-semibold"
                style={{ color: generatedTheme.text }}
              >
                ✨ {generatedTheme.name}
              </h5>
              <button
                onClick={handleTryAgain}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors hover:shadow-sm"
                style={{
                  backgroundColor: generatedTheme.background,
                  borderColor: generatedTheme.textSecondary + '30',
                  color: generatedTheme.textSecondary
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
            
            {/* Theme Preview */}
            <div className="space-y-3 mb-4">
              <div 
                className="h-4 rounded"
                style={{ 
                  background: `linear-gradient(135deg, ${generatedTheme.primary}, ${generatedTheme.secondary})`
                }}
              />
              <div 
                className="h-3 rounded w-3/4"
                style={{ backgroundColor: generatedTheme.text + '40' }}
              />
              <div 
                className="h-3 rounded w-1/2"
                style={{ backgroundColor: generatedTheme.textSecondary + '40' }}
              />
              <div 
                className="h-8 rounded-lg flex items-center justify-center text-white font-medium"
                style={{ 
                  background: `linear-gradient(135deg, ${generatedTheme.primary}, ${generatedTheme.accent})`
                }}
              >
                Sample Button
              </div>
            </div>

            <div 
              className="text-sm p-3 rounded-lg"
              style={{ 
                backgroundColor: generatedTheme.primary + '10',
                color: generatedTheme.text
              }}
            >
              <strong>🎉 Theme applied!</strong> This AI-generated theme is now active across your UniStore experience.
            </div>
          </div>
        )}

        {/* Info */}
        <div 
          className="text-sm p-4 rounded-lg"
          style={{ 
            backgroundColor: currentTheme.primary + '10',
            color: currentTheme.text
          }}
        >
          <strong>💡 How it works:</strong> Describe the mood, colors, or inspiration for your theme, and our AI will create a complete, harmonious color scheme with proper contrast and accessibility.
        </div>
      </div>
    </div>
  );
}
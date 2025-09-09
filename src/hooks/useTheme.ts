import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId, isAuthenticated } from './useTracking';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface BackgroundTexture {
  id: string;
  name: string;
  pattern: string;
  opacity: number;
}

export interface Theme {
  id: string;
  name: string;
  primary: string;
  primaryTsFormat: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  gradient: string;
  buttonGradient: string;
  buttonGradientHover: string;
  isDark?: boolean;
  backgroundTexture?: BackgroundTexture;
}

export const backgroundTextures: BackgroundTexture[] = [
  {
    id: 'none',
    name: 'None',
    pattern: '',
    opacity: 0
  },
  {
    id: 'grid',
    name: 'Grid',
    pattern: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
    opacity: 0.05
  },
  {
    id: 'diagonal',
    name: 'Diagonal Lines',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)',
    opacity: 0.08
  },
  {
    id: 'waves',
    name: 'Waves',
    pattern: 'radial-gradient(ellipse at center, transparent 20%, currentColor 21%, currentColor 25%, transparent 26%)',
    opacity: 0.06
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    pattern: 'radial-gradient(circle at 50% 50%, transparent 40%, currentColor 41%, currentColor 44%, transparent 45%)',
    opacity: 0.07
  }
];

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'UniStore Classic',
    primary: '#f97316',
    primaryTsFormat: 'orange-500',
    secondary: '#1e40af',
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
    gradient: 'from-orange-500 to-blue-600',
    buttonGradient: 'from-orange-500 to-orange-600',
    buttonGradientHover: 'hover:from-orange-600 hover:to-orange-700',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    primary: '#ff6b35',
    primaryTsFormat: 'orange-500',
    secondary: '#4f46e5',
    accent: '#06d6a0',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    gradient: 'from-orange-500 via-purple-500 to-teal-400',
    buttonGradient: 'from-orange-500 via-red-500 to-pink-500',
    buttonGradientHover: 'hover:from-orange-600 hover:via-red-600 hover:to-pink-600',
    isDark: true,
  },
  {
    id: 'sunset',
    name: 'Sunset Vibes',
    primary: '#f59e0b',
    primaryTsFormat: 'amber-500',
    secondary: '#dc2626',
    accent: '#ec4899',
    background: '#fef7ed',
    surface: '#fff7ed',
    text: '#92400e',
    textSecondary: '#d97706',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    buttonGradient: 'from-amber-500 to-red-500',
    buttonGradientHover: 'hover:from-amber-600 hover:to-red-600',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    primary: '#0ea5e9',
    primaryTsFormat: 'sky-500',
    secondary: '#0f766e',
    accent: '#06b6d4',
    background: '#f0f9ff',
    surface: '#e0f2fe',
    text: '#0c4a6e',
    textSecondary: '#0369a1',
    gradient: 'from-sky-400 via-cyan-500 to-teal-600',
    buttonGradient: 'from-sky-500 to-cyan-600',
    buttonGradientHover: 'hover:from-sky-600 hover:to-cyan-700',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '#22c55e',
    primaryTsFormat: 'green-500',
    secondary: '#15803d',
    accent: '#84cc16',
    background: '#f0fdf4',
    surface: '#dcfce7',
    text: '#14532d',
    textSecondary: '#166534',
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    buttonGradient: 'from-green-500 to-emerald-600',
    buttonGradientHover: 'hover:from-green-600 hover:to-emerald-700',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    primary: '#8b5cf6',
    primaryTsFormat: 'violet-500',
    secondary: '#7c3aed',
    accent: '#a855f7',
    background: '#faf5ff',
    surface: '#f3e8ff',
    text: '#581c87',
    textSecondary: '#7c2d12',
    gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    buttonGradient: 'from-violet-500 to-purple-600',
    buttonGradientHover: 'hover:from-violet-600 hover:to-purple-700',
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    primary: '#f43f5e',
    primaryTsFormat: 'rose-500',
    secondary: '#be185d',
    accent: '#ec4899',
    background: '#fff1f2',
    surface: '#ffe4e6',
    text: '#881337',
    textSecondary: '#be123c',
    gradient: 'from-rose-400 via-pink-500 to-red-500',
    buttonGradient: 'from-rose-500 to-pink-600',
    buttonGradientHover: 'hover:from-rose-600 hover:to-pink-700',
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    primary: '#3b82f6',
    primaryTsFormat: 'blue-500',
    secondary: '#1e40af',
    accent: '#6366f1',
    background: '#f8fafc',
    surface: '#f1f5f9',
    text: '#1e293b',
    textSecondary: '#475569',
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    buttonGradient: 'from-blue-500 to-indigo-600',
    buttonGradientHover: 'hover:from-blue-600 hover:to-indigo-700',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    primary: '#eab308',
    primaryTsFormat: 'yellow-500',
    secondary: '#d97706',
    accent: '#f59e0b',
    background: '#fffbeb',
    surface: '#fef3c7',
    text: '#92400e',
    textSecondary: '#d97706',
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    buttonGradient: 'from-yellow-500 to-amber-600',
    buttonGradientHover: 'hover:from-yellow-600 hover:to-amber-700',
  },
  {
    id: 'emerald',
    name: 'Emerald Dream',
    primary: '#10b981',
    primaryTsFormat: 'emerald-500',
    secondary: '#047857',
    accent: '#34d399',
    background: '#ecfdf5',
    surface: '#d1fae5',
    text: '#064e3b',
    textSecondary: '#065f46',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    buttonGradient: 'from-emerald-500 to-teal-600',
    buttonGradientHover: 'hover:from-emerald-600 hover:to-teal-700',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Purple',
    primary: '#a855f7',
    primaryTsFormat: 'purple-500',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    background: '#faf5ff',
    surface: '#f3e8ff',
    text: '#581c87',
    textSecondary: '#6b21a8',
    gradient: 'from-purple-400 via-violet-500 to-indigo-600',
    buttonGradient: 'from-purple-500 to-indigo-600',
    buttonGradientHover: 'hover:from-purple-600 hover:to-indigo-700',
  },
  // New themes
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    primary: '#f472b6',
    primaryTsFormat: 'pink-400',
    secondary: '#be185d',
    accent: '#ec4899',
    background: '#fdf2f8',
    surface: '#fce7f3',
    text: '#831843',
    textSecondary: '#be185d',
    gradient: 'from-pink-400 via-rose-400 to-red-400',
    buttonGradient: 'from-pink-400 to-rose-500',
    buttonGradientHover: 'hover:from-pink-500 hover:to-rose-600',
  },
  {
    id: 'arctic',
    name: 'Arctic Frost',
    primary: '#06b6d4',
    primaryTsFormat: 'cyan-500',
    secondary: '#0891b2',
    accent: '#67e8f9',
    background: '#f0fdff',
    surface: '#ecfeff',
    text: '#164e63',
    textSecondary: '#0891b2',
    gradient: 'from-cyan-400 via-blue-400 to-indigo-400',
    buttonGradient: 'from-cyan-500 to-blue-500',
    buttonGradientHover: 'hover:from-cyan-600 hover:to-blue-600',
  },
  {
    id: 'volcano',
    name: 'Volcano Fire',
    primary: '#ef4444',
    primaryTsFormat: 'red-500',
    secondary: '#dc2626',
    accent: '#f97316',
    background: '#fef2f2',
    surface: '#fee2e2',
    text: '#7f1d1d',
    textSecondary: '#dc2626',
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
    buttonGradient: 'from-red-500 to-orange-500',
    buttonGradientHover: 'hover:from-red-600 hover:to-orange-600',
  },
  {
    id: 'lavender',
    name: 'Lavender Fields',
    primary: '#a78bfa',
    primaryTsFormat: 'violet-400',
    secondary: '#7c3aed',
    accent: '#c4b5fd',
    background: '#faf5ff',
    surface: '#f3e8ff',
    text: '#581c87',
    textSecondary: '#7c3aed',
    gradient: 'from-violet-400 via-purple-400 to-indigo-400',
    buttonGradient: 'from-violet-400 to-purple-500',
    buttonGradientHover: 'hover:from-violet-500 hover:to-purple-600',
  },
  {
    id: 'mint',
    name: 'Fresh Mint',
    primary: '#34d399',
    primaryTsFormat: 'emerald-400',
    secondary: '#059669',
    accent: '#6ee7b7',
    background: '#f0fdf4',
    surface: '#dcfce7',
    text: '#064e3b',
    textSecondary: '#059669',
    gradient: 'from-emerald-400 via-green-400 to-teal-400',
    buttonGradient: 'from-emerald-400 to-green-500',
    buttonGradientHover: 'hover:from-emerald-500 hover:to-green-600',
  }
];

const THEME_STORAGE_KEY = 'unistore_theme';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      try {
        const savedTheme = JSON.parse(saved);
        // Check if it's a custom theme or find in predefined themes
        if (savedTheme.id === 'custom' || savedTheme.id === 'ai-generated') {
          return savedTheme;
        }
        const predefinedTheme = themes.find(t => t.id === savedTheme.id);
        if (predefinedTheme) return predefinedTheme;
      } catch (error) {
        console.error('Error parsing saved theme:', error);
      }
    }
    return themes[0]; // default theme
  });

  const [backgroundTexture, setBackgroundTexture] = useState<BackgroundTexture>(
    backgroundTextures[0]
  );

  useEffect(() => {
    // Load user's theme from database if authenticated
    const loadUserTheme = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        try {
          const userId = await getUserId();
          const { data, error } = await supabase
            .from('user_themes')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

          if (data && !error) {
            const themeData = data.theme_data as Theme;
            setCurrentTheme(themeData);
            if (themeData.backgroundTexture) {
              setBackgroundTexture(themeData.backgroundTexture);
            }
          }
        } catch (error) {
          console.error('Error loading user theme:', error);
        }
      }
    };

    loadUserTheme();
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
      ...currentTheme,
      backgroundTexture
    }));
    
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-secondary', currentTheme.secondary);
    root.style.setProperty('--theme-accent', currentTheme.accent);
    root.style.setProperty('--theme-background', currentTheme.background);
    root.style.setProperty('--theme-surface', currentTheme.surface);
    root.style.setProperty('--theme-text', currentTheme.text);
    root.style.setProperty('--theme-text-secondary', currentTheme.textSecondary);

    // Apply background texture
    if (backgroundTexture.id !== 'none') {
      root.style.setProperty('--bg-texture-pattern', backgroundTexture.pattern);
      root.style.setProperty('--bg-texture-opacity', backgroundTexture.opacity.toString());
      root.style.setProperty('--bg-texture-color', currentTheme.textSecondary);
    } else {
      root.style.removeProperty('--bg-texture-pattern');
      root.style.removeProperty('--bg-texture-opacity');
      root.style.removeProperty('--bg-texture-color');
    }
  }, [currentTheme, backgroundTexture]);

  const changeTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      await saveThemeToDatabase(theme);
    }
  };

  const setCustomTheme = async (customTheme: Theme) => {
    setCurrentTheme(customTheme);
    await saveThemeToDatabase(customTheme);
  };

  const changeBackgroundTexture = async (textureId: string) => {
    const texture = backgroundTextures.find(t => t.id === textureId);
    if (texture) {
      setBackgroundTexture(texture);
      const updatedTheme = { ...currentTheme, backgroundTexture: texture };
      setCurrentTheme(updatedTheme);
      await saveThemeToDatabase(updatedTheme);
    }
  };

  const saveThemeToDatabase = async (theme: Theme) => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) return;

      const userId = await getUserId();
      
      // Deactivate all existing themes for this user
      await supabase
        .from('user_themes')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Save new theme
      await supabase
        .from('user_themes')
        .insert({
          user_id: userId,
          theme_data: theme,
          theme_name: theme.name,
          is_active: true
        });
    } catch (error) {
      console.error('Error saving theme to database:', error);
    }
  };

  const generateAITheme = async (description: string): Promise<Theme | null> => {
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
Create a beautiful theme based on this description: "${description}"

Generate a JSON object with these exact properties:
{
  "id": "ai-generated",
  "name": "Generated Theme Name",
  "primary": "#hex_color",
  "primaryTsFormat": "tailwind-color-format",
  "secondary": "#hex_color", 
  "accent": "#hex_color",
  "background": "#hex_color",
  "surface": "#hex_color",
  "text": "#hex_color",
  "textSecondary": "#hex_color",
  "gradient": "from-color-500 to-color-600",
  "buttonGradient": "from-color-500 to-color-600",
  "buttonGradientHover": "hover:from-color-600 hover:to-color-700",
  "isDark": false
}

Requirements:
- Ensure good contrast between text and background colors
- Use harmonious color combinations
- Make it visually appealing and professional
- If description suggests dark theme, set isDark to true and use dark colors
- Return ONLY the JSON object, no other text
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Extract JSON from response
      let jsonText = text;
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }

      const themeData = JSON.parse(jsonText);
      return themeData as Theme;
    } catch (error) {
      console.error('Error generating AI theme:', error);
      return null;
    }
  };

  return {
    currentTheme,
    themes,
    backgroundTextures,
    backgroundTexture,
    changeTheme,
    setCustomTheme,
    changeBackgroundTexture,
    generateAITheme,
    saveThemeToDatabase
  };
}
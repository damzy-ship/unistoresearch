import React, { createContext, useContext, useState, useEffect } from 'react';
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
    { id: 'none', name: 'None', pattern: '', opacity: 0 },
    { id: 'grid', name: 'Grid', pattern: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', opacity: 0.05 },
    { id: 'diagonal', name: 'Diagonal Lines', pattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)', opacity: 0.08 },
    { id: 'waves', name: 'Waves', pattern: 'radial-gradient(ellipse at center, transparent 20%, currentColor 21%, currentColor 25%, transparent 26%)', opacity: 0.06 },
    { id: 'hexagon', name: 'Hexagon', pattern: 'radial-gradient(circle at 50% 50%, transparent 40%, currentColor 41%, currentColor 44%, transparent 45%)', opacity: 0.07 }
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
    }
];

const THEME_STORAGE_KEY = 'unistore_theme';

interface ThemeContextType {
    currentTheme: Theme;
    themes: Theme[];
    backgroundTextures: BackgroundTexture[];
    backgroundTexture: BackgroundTexture;
    changeTheme: (themeId: string) => Promise<void>;
    setCustomTheme: (customTheme: Theme) => Promise<void>;
    changeBackgroundTexture: (textureId: string) => Promise<void>;
    generateAITheme: (description: string) => Promise<Theme | null>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
            try {
                const savedTheme = JSON.parse(saved);
                if (savedTheme.id === 'custom' || savedTheme.id === 'ai-generated') return savedTheme;
                const predefinedTheme = themes.find(t => t.id === savedTheme.id);
                if (predefinedTheme) return predefinedTheme;
            } catch (e) { console.error('Error parsing theme:', e); }
        }
        return themes[0];
    });

    const [backgroundTexture, setBackgroundTexture] = useState<BackgroundTexture>(backgroundTextures[0]);

    useEffect(() => {
        const loadUserTheme = async () => {
            if (await isAuthenticated()) {
                const userId = await getUserId();
                const { data: rows } = await supabase
                    .from('user_themes')
                    .select('*')
                    .eq('user_id', userId)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                if (rows?.[0]?.theme_data) {
                    const themeData = rows[0].theme_data as Theme;
                    setCurrentTheme(themeData);
                    if (themeData.backgroundTexture) setBackgroundTexture(themeData.backgroundTexture);
                }
            }
        };
        loadUserTheme();
    }, []);

    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ ...currentTheme, backgroundTexture }));
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', currentTheme.primary);
        root.style.setProperty('--theme-secondary', currentTheme.secondary);
        root.style.setProperty('--theme-accent', currentTheme.accent);
        root.style.setProperty('--theme-background', currentTheme.background);
        root.style.setProperty('--theme-surface', currentTheme.surface);
        root.style.setProperty('--theme-text', currentTheme.text);
        root.style.setProperty('--theme-text-secondary', currentTheme.textSecondary);

        if (currentTheme.isDark) root.classList.add('dark');
        else root.classList.remove('dark');

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
        if (!await isAuthenticated()) return;
        const userId = await getUserId();
        await supabase.from('user_themes').upsert({ user_id: userId, theme_data: theme, theme_name: theme.name, is_active: true }, { onConflict: 'user_id' });
    };

    const generateAITheme = async (description: string): Promise<Theme | null> => {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) return null;
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Create a theme: "${description}". Return ONLY JSON: { "id": "ai-generated", "name": "...", "primary": "...", "primaryTsFormat": "...", "secondary": "...", "accent": "...", "background": "...", "surface": "...", "text": "...", "textSecondary": "...", "gradient": "...", "buttonGradient": "...", "buttonGradientHover": "...", "isDark": false }`;
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, themes, backgroundTextures, backgroundTexture, changeTheme, setCustomTheme, changeBackgroundTexture, generateAITheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};

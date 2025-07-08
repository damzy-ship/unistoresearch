import { useState, useEffect } from 'react';

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
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'UniStore Classic',
    primary: '#f97316', // orange-500
    primaryTsFormat: 'orange-500',
    secondary: '#1e40af', // blue-800
    accent: '#8b5cf6', // violet-500
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
    gradient: 'from-orange-500 to-blue-600',
    buttonGradient: 'from-orange-500 to-orange-600',
    buttonGradientHover: 'hover:from-orange-600 hover:to-orange-700',
  },
  {
    id: 'sunset',
    name: 'Sunset Vibes',
    primary: '#f59e0b', // amber-500
    primaryTsFormat: 'amber-500',
    secondary: '#dc2626', // red-600
    accent: '#ec4899', // pink-500
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
    primary: '#0ea5e9', // sky-500
    primaryTsFormat: 'sky-500',
    secondary: '#0f766e', // teal-700
    accent: '#06b6d4', // cyan-500
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
    primary: '#22c55e', // green-500
    primaryTsFormat: 'green-500',
    secondary: '#15803d', // green-700
    accent: '#84cc16', // lime-500
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
    primary: '#8b5cf6', // violet-500
    primaryTsFormat: 'violet-500',
    secondary: '#7c3aed', // violet-600
    accent: '#a855f7', // purple-500
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
    primary: '#f43f5e', // rose-500
    primaryTsFormat: 'rose-500',
    secondary: '#be185d', // pink-700
    accent: '#ec4899', // pink-500
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
    primary: '#3b82f6', // blue-500
    primaryTsFormat: 'blue-500',
    secondary: '#1e40af', // blue-800
    accent: '#6366f1', // indigo-500
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
    primary: '#eab308', // yellow-500
    primaryTsFormat: 'yellow-500',
    secondary: '#d97706', // amber-600
    accent: '#f59e0b', // amber-500
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
    primary: '#10b981', // emerald-500
    primaryTsFormat: 'emerald-500',
    secondary: '#047857', // emerald-700
    accent: '#34d399', // emerald-400
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
    primary: '#a855f7', // purple-500
    primaryTsFormat: 'purple-500',
    secondary: '#6366f1', // indigo-500
    accent: '#8b5cf6', // violet-500
    background: '#faf5ff',
    surface: '#f3e8ff',
    text: '#581c87',
    textSecondary: '#6b21a8',
    gradient: 'from-purple-400 via-violet-500 to-indigo-600',
    buttonGradient: 'from-purple-500 to-indigo-600',
    buttonGradientHover: 'hover:from-purple-600 hover:to-indigo-700',
  }
];

const THEME_STORAGE_KEY = 'unistore_theme';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      const savedTheme = themes.find(t => t.id === saved);
      if (savedTheme) return savedTheme;
    }
    return themes[0]; // default theme
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme.id);
    
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-secondary', currentTheme.secondary);
    root.style.setProperty('--theme-accent', currentTheme.accent);
    root.style.setProperty('--theme-background', currentTheme.background);
    root.style.setProperty('--theme-surface', currentTheme.surface);
    root.style.setProperty('--theme-text', currentTheme.text);
    root.style.setProperty('--theme-text-secondary', currentTheme.textSecondary);
  }, [currentTheme]);

  const changeTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      window.location.reload();
    }
  };

  return {
    currentTheme,
    themes,
    changeTheme
  };
}
// src/contexts/theme-context.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'classic' | 'modern';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Load theme from localStorage, default to 'modern'
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('otis-ui-theme');
      return (saved === 'classic' || saved === 'modern') ? saved : 'modern';
    } catch {
      return 'modern';
    }
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('otis-ui-theme', theme);
      // Add theme class to body for global styling
      document.body.classList.remove('theme-classic', 'theme-modern');
      document.body.classList.add(`theme-${theme}`);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'classic' ? 'modern' : 'classic');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
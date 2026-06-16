"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');

  useEffect(() => {
    // initialize from localStorage if available
    try {
      const stored = localStorage.getItem('anapath:theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored as ThemeMode);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (mode: ThemeMode) => {
      const el = document.documentElement;
      if (!el) return;
      if (mode === 'system') {
        el.dataset.theme = 'system';
        el.classList.toggle('dark', prefersDark.matches);
      } else {
        el.dataset.theme = mode;
        el.classList.toggle('dark', mode === 'dark');
      }
    };

    const updateSystemTheme = () => {
      if (theme === 'system') {
        apply('system');
      }
    };

    apply(theme);
    try {
      localStorage.setItem('anapath:theme', theme);
    } catch (e) {
      // ignore
    }
    prefersDark.addEventListener('change', updateSystemTheme);
    return () => prefersDark.removeEventListener('change', updateSystemTheme);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Provide a safe fallback so components don't crash if ThemeProvider is missing
    return {
      theme: 'system' as ThemeMode,
      setTheme: (() => {}) as (mode: ThemeMode) => void,
    };
  }
  return ctx;
}

export default ThemeProvider;

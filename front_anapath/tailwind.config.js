import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface hierarchy
        "surface": "#f9f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3fb",
        "surface-container": "#ecedf6",
        "surface-container-high": "#e7e8f0",
        "surface-container-highest": "#e1e2ea",
        // On colors
        "on-surface": "#191c21",
        "on-surface-variant": "#424752",
        // Primary
        "primary": "#00478d",
        "primary-container": "#005eb8",
        "primary-fixed": "#d6e3ff",
        "on-primary": "#ffffff",
        // Secondary
        "secondary": "#4a5f83",
        "secondary-container": "#c0d5ff",
        "secondary-fixed": "#d6e3ff",
        "on-secondary": "#ffffff",
        // Tertiary (Emergency/STAT)
        "tertiary": "#950000",
        "tertiary-container": "#c20000",
        "tertiary-fixed": "#ffdad4",
        "on-tertiary": "#ffffff",
        // Error
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        // Outline
        "outline": "#727783",
        "outline-variant": "#c2c6d4",
        // Inverse
        "inverse-surface": "#2e3037",
        "inverse-primary": "#a9c7ff",
        "inverse-on-surface": "#eff0f8",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "Manrope"],
        body: ["var(--font-inter)", "Inter"],
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'stat-pulse': 'stat-pulse 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
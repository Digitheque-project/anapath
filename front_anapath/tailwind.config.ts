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
        primary: "#00478d",
        "primary-container": "#005eb8",
        surface: "#f9f9ff",
        "surface-container-low": "#f2f3fb",
        "surface-container": "#ecedf6",
        "surface-container-high": "#e7e8f0",
        "surface-container-highest": "#e1e2ea",
        "on-surface": "#191c21",
        "on-surface-variant": "#424752",
        tertiary: "#950000",
        secondary: "#4a5f83",
        outline: "#727783",
        "outline-variant": "#c2c6d4",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "Manrope"],
        body: ["var(--font-inter)", "Inter"],
      },
    },
  },
  plugins: [],
};

export default config;
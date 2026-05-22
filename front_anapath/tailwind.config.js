/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#00478d",
        "on-primary": "#ffffff",
        "surface": "#f9f9ff",
        "surface-container-low": "#f2f3fb",
        "surface-container-highest": "#e1e2ea",
        "on-surface": "#191c21",
        "on-surface-variant": "#424752",
        "outline-variant": "#c2c6d4",
        "tertiary": "#950000",
        "secondary": "#4a5f83",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "Manrope"],
        body: ["var(--font-inter)", "Inter"],
      },
    },
  },
  plugins: [],
}

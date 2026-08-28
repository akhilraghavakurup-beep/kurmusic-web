/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kur: {
          bg: '#080612',
          surface: '#0E0B1D',
          card: 'rgba(22, 17, 41, 0.7)',
          cardHover: 'rgba(32, 25, 60, 0.85)',
          purple: '#9333EA',
          purpleLight: '#C084FC',
          purpleGlow: 'rgba(147, 51, 234, 0.35)',
          pink: '#EC4899',
          cyan: '#06B6D4',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(147, 51, 234, 0.4)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 18s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

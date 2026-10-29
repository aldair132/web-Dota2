/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0E13',
          panel: '#141922',
          panel2: '#1C2330',
          borde: '#2A3342',
          red: '#C23C2A',
          redDark: '#8E2A1D',
          gold: '#D4A64A',
          text: '#E6E1D6',
          muted: '#8C95A3',
        },
      },
      fontFamily: {
        serif: ['"Cinzel"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

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
        alfa: {
          bg: '#09090B',
          surface: '#18181B',
          primary: '#059669',
          accent: '#10B981',
          text: '#FAFAFA',
          heatmap: '#22C55E'
        }
      }
    },
  },
  plugins: [],
}

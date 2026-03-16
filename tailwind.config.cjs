/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      colors: {
        eter: {
          bg: '#0a0b0f',
          card: '#10121a',
          text: '#f0e4ff',
          accent: '#b65cff',
          glow: '#d08cff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(190,96,255,0.22)'
      }
    }
  },
  darkMode: 'class',
  plugins: []
}

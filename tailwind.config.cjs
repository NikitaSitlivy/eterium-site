/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      colors: {
        eter: {
          bg: '#0a0b0f',
          card: '#10121a',
          text: '#d7e0ff',
          accent: '#7aa2ff',
          glow: '#94b4ff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(122,162,255,0.15)'
      }
    }
  },
  darkMode: 'class',
  plugins: []
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E10600',
          darkred: '#9B0400',
          lightred: '#FF3B30',
          carbon: '#0D0D11',
          card: '#14141B',
          cardHover: '#1B1B24',
          border: '#232330',
          textMuted: '#8E8E9F',
        },
        telemetry: {
          speed: '#00F0FF',
          throttle: '#00FF66',
          brake: '#FF1801',
          steer: '#FFAA00',
          latG: '#D946EF',
          lonG: '#3B82F6',
          slip: '#F59E0B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        racing: ['Michroma', 'Eurostile', 'Microgramma', 'sans-serif'],
        hud: ['Orbitron', 'Rajdhani', 'sans-serif'],
        'hud-clean': ['Rajdhani', 'Orbitron', 'sans-serif'],
        tech: ['"Barlow Condensed"', '"DIN 1451"', '"FF DIN"', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        barlow: ['Barlow', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'ui-monospace', 'monospace'],
        display: ['Michroma', 'Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}

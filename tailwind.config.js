/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        rose: {
          gold: '#B76E79',
          'gold-light': '#C98A93',
          'gold-dark': '#9A5660',
        },
        cream: {
          DEFAULT: '#FAF7F5',
          dark: '#F2EDE9',
          light: '#FDFBF9',
        },
        blush: '#F2D7D9',
        charcoal: '#2D2D2D',
        emerald: {
          DEFAULT: '#2E8B6D',
          light: '#3DA882',
        },
        amber: {
          warn: '#E8A838',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

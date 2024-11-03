/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"Courier New"', 'monospace'],
      },
      colors: {
        'custom-aqua': '#00ffbd',
      },
    },
  },
  plugins: [],
}

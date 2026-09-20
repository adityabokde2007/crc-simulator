/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FA',
        surface: '#FFFFFF',
        border: '#E2E6EC',
        'text-primary': '#1C2333',
        'text-secondary': '#5B6478',
        accent: '#2F5D8C',
        error: '#C4593F',
        success: '#3E8267',
        highlight: '#E0A62E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

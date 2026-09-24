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
        apple: {
          bg: '#F5F5F7',
          darkBg: '#161618',
          card: '#FFFFFF',
          darkCard: '#242426',
          border: '#E5E5EA',
          darkBorder: '#38383A',
          blue: '#007AFF',
          cyan: '#32ADE6',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          purple: '#AF52DE',
          text: '#1D1D1F',
          darkText: '#F5F5F7',
          secondary: '#8E8E93'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'apple': '0 8px 30px rgba(0, 0, 0, 0.06)',
        'apple-dark': '0 12px 40px rgba(0, 0, 0, 0.45)',
        'apple-glow': '0 0 24px rgba(0, 122, 255, 0.25)',
      },
      borderRadius: {
        'apple': '20px',
        'apple-lg': '24px',
      }
    },
  },
  plugins: [],
}

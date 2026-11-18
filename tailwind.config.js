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
        pine: {
          DEFAULT: '#25433E',
          50: '#F0F5F4',
          100: '#DCE8E6',
          500: '#25433E',
          600: '#1F3934',
          700: '#1A312D',
          800: '#142724',
          900: '#0E1C1A',
        },
        honey: {
          DEFAULT: '#E5A93C',
          50: '#FDF8EE',
          100: '#FBF0D9',
          400: '#EDB958',
          500: '#E5A93C',
          600: '#DF9E2E',
          700: '#CD8D20',
        },
        sage: {
          DEFAULT: '#E6EFEF',
          50: '#F6F9F9',
          100: '#E6EFEF',
          200: '#D2E3E3',
          300: '#B8D4D4',
        },
        ocean: {
          DEFAULT: '#1E7B75',
          500: '#1E7B75',
          600: '#176560',
        },
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
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'sans-serif'],
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

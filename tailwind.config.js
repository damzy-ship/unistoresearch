/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        "sans": ['"Bricolage Grotesque"', 'Inter', 'sans-serif'],
      },
      colors: {
        "primary": "#ed5b0c",
        "navy": "#1a237e",
        "accent-blue": "#1a2a40",
        "background-light": "#f8f6f5",
        "background-dark": "#221610",
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      keyframes: {
        // ... existing keyframes
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.8s ease-out forwards',
        'bounce-in': 'bounce-in 0.8s ease-out forwards',
        'blink': 'blink 0.7s infinite'
      }
    },
  },
  plugins: [],
};

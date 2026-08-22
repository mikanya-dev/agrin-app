export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E2703A',
        secondary: '#88D8B0',
        accent: '#B39CD0',
      },
      fontFamily: {
        sans: ['"Meiryo"', '"Hiragino Kaku Gothic ProN"', '"MS PGothic"', 'sans-serif'],
      },
      animation: {
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-0.5rem)' }
        }
      }
    },
  },
  plugins: [],
}

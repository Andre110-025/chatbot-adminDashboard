/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  // darkMode: 'class',
  theme: {
    extend: {
      screens: {
        sm600: "600px"
      },
      colors: {
        mainColor: '#05716c',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // fadeInUp: 'fadeInUp 0.8s ease-out',
        fadeUp: 'fadeUp 0.6s ease-out',
      },
    },
  },
  plugins: [],
}

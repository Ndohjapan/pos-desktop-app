import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          100: '#E6ECF9',
          200: '#C2D1F2',
          300: '#9EB5EA',
          400: '#7A9AE3',
          500: '#567EDB',
          600: '#3263D4',
          700: '#012FA9',
          800: '#012588',
          900: '#011C66'
        },
        secondary: '#747474'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config

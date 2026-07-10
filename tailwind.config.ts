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
          50: '#EEF3FE',
          100: '#E6ECF9',
          200: '#C2D1F2',
          300: '#9EB5EA',
          400: '#7A9AE3',
          500: '#567EDB',
          600: '#2E5AD0',
          700: '#012FA9',
          800: '#012588',
          900: '#011C66'
        },
        secondary: '#334155',
        // --- Premium neutral + semantic system ---
        app: '#F4F6FA', // app canvas (soft cool gray)
        surface: '#FFFFFF', // cards / panels
        ink: '#0F172A', // headings / primary text
        muted: '#64748B', // secondary text
        line: '#E8EBF1', // borders / dividers
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10A56A',
          600: '#0E9F6E',
          700: '#047857'
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#E02424',
          700: '#B91C1C'
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#D97706',
          700: '#B45309'
        }
      },
      borderRadius: {
        card: '0.875rem',
        control: '0.625rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        elevated: '0 10px 30px -10px rgba(16, 24, 40, 0.18), 0 4px 12px -4px rgba(16, 24, 40, 0.08)',
        focus: '0 0 0 3px rgba(1, 47, 169, 0.12)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config

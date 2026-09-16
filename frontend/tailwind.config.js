/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#5a87c2',
          100: '#3c6baa',
          200: '#2860a3',
          300: '#0f4685',
          400: '#1d5497',
          500: '#1b407a',
          600: '#12306e',
          700: '#07226b',
          800: '#0a1949',
          900: '#071438',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--color-base)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        heading: 'var(--color-heading)',
        accent: {
          indigo: '#6366f1',
          sky: '#0ea5e9',
          orange: '#f97316',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        hero: 'clamp(3rem, 8vw, 7rem)',
        h1: 'clamp(2rem, 5vw, 4rem)',
        h2: 'clamp(1.5rem, 3.5vw, 3rem)',
        h3: 'clamp(1.25rem, 2.5vw, 2rem)',
        body: 'clamp(1rem, 1.2vw, 1.125rem)',
        sm2: 'clamp(0.875rem, 1vw, 1rem)',
      },
    },
  },
  plugins: [],
}

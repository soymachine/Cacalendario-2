/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        salmon: '#dd8273',
        'salmon-light': 'rgba(255, 255, 255, 0.28)',

        // Fluxia design system — brand scales
        'fx-blue': {
          50: '#EEF4FB', 100: '#DAE8F5', 200: '#BAD3EC', 300: '#90B7DD', 400: '#6298CB',
          500: '#3C7DB8', 600: '#316499', 700: '#2A547D', 800: '#274867', 900: '#1F3A53',
        },
        'fx-green': {
          50: '#EDF7F1', 100: '#D6EEE0', 200: '#AFDDC3', 300: '#83C9A3', 400: '#60B187',
          500: '#4DA078', 600: '#3E8463', 700: '#346B52', 800: '#2C5644', 900: '#244739',
        },
        'fx-teal': {
          50: '#ECF6F6', 100: '#D4ECEC', 200: '#A9DADB', 300: '#79C5C6', 400: '#57B0B2',
          500: '#4DA0A2', 600: '#3E8385', 700: '#346B6D', 800: '#2C5759', 900: '#244748',
        },
        'fx-lime': {
          50: '#FAFBE6', 100: '#F4F6C3', 200: '#E9EC8C', 300: '#DCE05A', 400: '#CFD33C',
          500: '#B4B833', 600: '#8E9229',
        },
        'fx-violet': {
          100: '#E8E7F7', 200: '#D0CEEF', 300: '#B0ABE2', 400: '#968FD6', 500: '#8480C9',
        },
        'fx-ink': {
          50: '#F4F7F3', 100: '#EEF2EE', 150: '#E6EAE6', 200: '#DCE2DF', 250: '#CCD4D2',
          300: '#B9C2C5', 400: '#95A0A5', 500: '#717C82', 600: '#586269', 700: '#3F484D',
          800: '#2D3539', 900: '#222A2E',
        },
        'fx-success': { 50: '#EAF6EF', 100: '#D2EDDD', 500: '#3F9E6E', 600: '#338058', 700: '#2A6747' },
        'fx-warning': { 50: '#FCF4E7', 100: '#F8E6C7', 300: '#EEBF77', 500: '#E09F3C', 600: '#C0832B', 700: '#99681F' },
        'fx-error': { 50: '#FBEDED', 100: '#F6DADA', 300: '#E6A1A1', 500: '#D26464', 600: '#BB4E4E', 700: '#9B4040' },

        // Semantic aliases (CSS-var backed so per-doctor accents can override)
        'fx-bg': 'var(--color-bg)',
        'fx-surface': 'var(--color-surface)',
        'fx-surface-2': 'var(--color-surface-2)',
        'fx-primary': 'var(--color-primary)',
        'fx-primary-hover': 'var(--color-primary-hover)',
        'fx-secondary': 'var(--color-secondary)',
        'fx-accent': 'var(--color-accent)',
        'fx-highlight': 'var(--color-highlight)',
        'fx-success-on': 'var(--color-success)',
        'fx-warning-on': 'var(--color-warning)',
        'fx-error-on': 'var(--color-error)',
        'fx-text': 'var(--text-primary)',
        'fx-text-secondary': 'var(--text-secondary)',
        'fx-text-tertiary': 'var(--text-tertiary)',
        'fx-border': 'var(--border)',
        'fx-border-soft': 'var(--border-soft)',
        'fx-accent-medic': 'var(--medics-accent, var(--color-primary))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        fx: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'fx-xs': 'var(--radius-xs)',
        'fx-sm': 'var(--radius-sm)',
        'fx-md': 'var(--radius-md)',
        'fx-lg': 'var(--radius-lg)',
        'fx-xl': 'var(--radius-xl)',
        'fx-2xl': 'var(--radius-2xl)',
        'fx-3xl': 'var(--radius-3xl)',
        'fx-pill': 'var(--radius-pill)',
      },
      boxShadow: {
        'fx-xs': 'var(--shadow-xs)',
        'fx-sm': 'var(--shadow-sm)',
        'fx-md': 'var(--shadow-md)',
        'fx-lg': 'var(--shadow-lg)',
        'fx-xl': 'var(--shadow-xl)',
        'fx-primary': 'var(--shadow-primary)',
      },
    },
  },
  plugins: [],
};

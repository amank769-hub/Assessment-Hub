/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand chrome — navigation, headers, gradients. Never used as series colors.
        navy: {
          50: '#EEF2FA', 100: '#D6DEF0', 200: '#AEBEE0', 300: '#7B92C6',
          400: '#4C67A5', 500: '#2C4680', 600: '#1B3163',
          700: '#12275A', 800: '#0B1B3F', 900: '#0A1330', 950: '#060C20',
        },
        electric: {
          50: '#EFF5FE', 100: '#DBE9FD', 200: '#B9D4FA', 300: '#86B6EF',
          400: '#5090E4', 500: '#2A78D6', 600: '#0763C4', 700: '#004EA9',
          800: '#003C88', 900: '#002B65',
        },
        violet: {
          50: '#F2F0FB', 100: '#E4E0F6', 200: '#C9C1ED', 300: '#A79BE0',
          400: '#7E6ECC', 500: '#5C49B6', 600: '#4A3AA7', 700: '#3B2E86',
          800: '#2C2265', 900: '#1E1745',
        },
        ink: { DEFAULT: '#0F172A', soft: '#334155', muted: '#64748B', faint: '#94A3B8' },
        surface: { page: '#F5F7FB', card: '#FFFFFF', sunken: '#EEF2F9', line: '#E4E9F2' },
        // Status — reserved meaning, always shipped with an icon + label.
        rag: { good: '#0CA30C', warning: '#FAB219', serious: '#EC835A', critical: '#D03B3B' },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px -6px rgba(15,23,42,.10)',
        lift: '0 2px 4px rgba(15,23,42,.05), 0 12px 32px -10px rgba(15,23,42,.18)',
        pop: '0 8px 40px -8px rgba(11,27,63,.28)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.6)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem' },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #0B1B3F 0%, #12275A 45%, #2A3F86 100%)',
        'electric-grad': 'linear-gradient(135deg, #2A78D6 0%, #4A3AA7 100%)',
        'sheen': 'linear-gradient(180deg, rgba(255,255,255,.9) 0%, rgba(255,255,255,.55) 100%)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-in': { '0%': { transform: 'translateX(16px)', opacity: '0' }, '100%': { transform: 'none', opacity: '1' } },
        'pulse-ring': { '0%': { boxShadow: '0 0 0 0 rgba(208,59,59,.45)' }, '70%': { boxShadow: '0 0 0 10px rgba(208,59,59,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(208,59,59,0)' } },
        'bar-grow': { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
      },
      animation: {
        'fade-up': 'fade-up .38s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .28s ease-out both',
        'slide-in': 'slide-in .3s cubic-bezier(.22,1,.36,1) both',
        'pulse-ring': 'pulse-ring 2s infinite',
        'bar-grow': 'bar-grow .7s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
}

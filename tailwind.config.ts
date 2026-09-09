import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        base: {
          bg: '#EEF2F8',
          surface: '#FFFFFF',
          muted: '#F5F7FC',
          border: '#E2E8F3',
          'border-strong': '#CBD5E1',
          navy: '#0B1220',
          'navy-soft': '#111A2E',
        },
        ink: {
          900: '#0B1220',
          700: '#1E293B',
          500: '#64748B',
          400: '#94A3B8',
          300: '#B7C1D1',
          inverse: '#F4F7FC',
        },
        accent: {
          DEFAULT: '#06B6D4',
          cyan: '#06B6D4',
          soft: '#22D3EE',
          bg: '#ECFEFF',
          dim: '#0E7490',
        },
        risk: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444',
        },
        entity: {
          person: '#3B82F6',
          phone: '#A78BFA',
          vehicle: '#14B8A6',
          location: '#F97316',
          organization: '#EC4899',
          event: '#94A3B8',
          account: '#10B981',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        panel: '0 4px 16px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        glow: '0 0 0 1px rgba(6,182,212,0.15), 0 0 20px rgba(6,182,212,0.12)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(6,182,212,0.45)' },
          '100%': { boxShadow: '0 0 0 8px rgba(6,182,212,0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

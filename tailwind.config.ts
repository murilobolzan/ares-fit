import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: '#FFE600',
        'brand-hover': '#E6CF00',
        'brand-soft': 'rgba(255,230,0,0.10)',
        background: '#000000',
        surface: '#0F0F0F',
        'surface-2': '#1A1A1A',
        'surface-3': '#222225',
        border: '#222225',
        primary: '#FFFFFF',
        secondary: '#A1A1AA',
        muted: '#555558',
        danger: '#FF3B30',
        success: '#22C55E',
        warning: '#FF9F0A',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-brand': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(255, 230, 0, 0.4)' },
          '50%': { opacity: '.8', boxShadow: '0 0 0 10px rgba(255, 230, 0, 0)' },
        },
        'slide-down': {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'pulse-brand': 'pulse-brand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-down': 'slide-down 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
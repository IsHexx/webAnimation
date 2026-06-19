import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Noto Serif SC', 'serif'],
        body: ['"Noto Sans SC"', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        frost: '0 0 60px rgba(186, 220, 255, 0.22)',
      },
    },
  },
  plugins: [],
} satisfies Config;

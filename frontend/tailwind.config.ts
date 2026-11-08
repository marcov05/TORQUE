import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        torque: {
          graphite: '#17191D',
          charcoal: '#252A31',
          red: '#D94747',
          offwhite: '#F3F4F6',
          muted: '#8B929C',
          green: '#27966B',
          yellow: '#D9A441',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

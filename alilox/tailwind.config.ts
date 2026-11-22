import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx,js}'],
  theme: { extend: { colors: { ink: '#141A3B', ink2: '#1F2B5B', sky: '#7EC8FF', sun: '#FFD23F', candy: '#FF5DA2', mint: '#2EE6D6', grape: '#A78BFA', lime: '#4ADE80', peach: '#FF8A3D' },
    fontFamily: { display: ['Fredoka', 'Cairo', 'sans-serif'], body: ['Nunito', 'Cairo', 'sans-serif'] },
    boxShadow: { pop: '0 6px 0 rgba(0,0,0,.28)', card: '0 10px 30px rgba(0,0,0,.25)' } } },
  plugins: [],
} satisfies Config;

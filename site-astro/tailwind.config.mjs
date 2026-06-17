/** @type {import('tailwindcss').Config} */
// Porte aqui o tema do seu assets/js/tailwind-config.js atual (cores, fontes).
export default {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0b',
        secondary: '#1a1915',
        accent: '#8B6F47',
        light: '#f0ede6',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

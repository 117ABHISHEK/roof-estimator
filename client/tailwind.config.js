/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1F4E3D',
          light: '#2D6A50',
          dark: '#153629'
        }
      }
    }
  },
  plugins: []
};

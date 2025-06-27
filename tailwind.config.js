/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.html"
  ],
  safelist: [
    'animate-fadein',
    'animate-fadein2',
    'animate-fadein3',
    'animate-fadein4',
    'animate-fadein5',
  ],
  theme: {
    extend: {
      keyframes: {
        fadein: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        fadein2: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        fadein3: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        fadein4: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        fadein5: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadein: 'fadein 0.7s cubic-bezier(.4,2,.6,1) both',
        fadein2: 'fadein2 0.8s cubic-bezier(.4,2,.6,1) both',
        fadein3: 'fadein3 0.9s cubic-bezier(.4,2,.6,1) both',
        fadein4: 'fadein4 1s cubic-bezier(.4,2,.6,1) both',
        fadein5: 'fadein5 1.1s cubic-bezier(.4,2,.6,1) both',
      },
    },
  },
  plugins: [],
} 
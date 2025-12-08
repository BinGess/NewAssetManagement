/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        border: '#e5e7eb',
        text: '#111827',
        muted: '#6b7280',
        primary: '#2563eb'
      },
      borderRadius: {
        md: '6px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
}
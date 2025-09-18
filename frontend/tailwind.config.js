/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'profile-purple': '#6a4fe6',
        'profile-red': '#ff6b61',
        'profile-blue': '#6a70c9',
        'input-gray': '#6b6b77',
        'border-gray': 'rgba(18,22,40,0.06)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: "0 10px 22px rgba(28, 31, 77, 0.18), 0 2px 6px rgba(28, 31, 77, 0.06)",
        inner: "inset 0 -4px 8px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
}

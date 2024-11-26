/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Remix app folder
    "./components/**/*.{js,ts,jsx,tsx}", // For shared components
    "./node_modules/@shopify/polaris/**/*.{js,ts,jsx,tsx}" // Optional: for Polaris integration
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

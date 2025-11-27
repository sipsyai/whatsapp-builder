/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#13ec5b", // Main Brand Green
        "primary-blue": "#4A90E2", // Node Config Blue
        background: "#102216",
        surface: "#112217",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        node: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
}

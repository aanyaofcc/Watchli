/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        brand: "#0f766e",
        accent: "#14b8a6"
      },
      boxShadow: {
        soft: "0 24px 60px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

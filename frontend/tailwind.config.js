/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        skyline: "#1074FE",
        mint: "#39D98A",
      },
      boxShadow: {
        soft: "0 20px 60px -30px rgba(15,23,42,0.35)",
      },
      borderRadius: {
        card: "1.25rem",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        gradientShift: "gradientShift 15s ease infinite",
      },
    },
  },
  plugins: [],
};

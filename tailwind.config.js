/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#211F1C",
        ivory: "#F7F3E9",
        navy: {
          DEFAULT: "#16264A",
          50: "#EEF1F7",
          100: "#D6DDEC",
          400: "#33487A",
          600: "#1E3260",
          700: "#16264A",
          900: "#0D1730",
        },
        brass: {
          DEFAULT: "#B8862E",
          50: "#FBF3E3",
          200: "#E9C784",
          400: "#C99B3F",
          600: "#96691F",
        },
        maroon: {
          DEFAULT: "#6E1E2C",
          600: "#5A1723",
          700: "#471221",
        },
        sage: "#7C8B6F",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "rule-lines":
          "repeating-linear-gradient(transparent, transparent 27px, rgba(22,38,74,0.08) 28px)",
      },
      boxShadow: {
        plaque: "inset 0 0 0 1px rgba(184,134,46,0.35)",
      },
    },
  },
  plugins: [],
};

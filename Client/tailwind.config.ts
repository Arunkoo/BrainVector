/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      borderRadius: {
        xl: "var(--radius-xl, 1.5rem)",
        lg: "var(--radius-lg, 0.75rem)",
        md: "var(--radius-md, 0.5rem)",
        sm: "var(--radius-sm, 0.25rem)",
      },
    },
  },
  plugins: [],
};

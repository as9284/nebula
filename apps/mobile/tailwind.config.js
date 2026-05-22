/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{tsx,ts}", "./src/**/*.{tsx,ts}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#171714",
        surface: "#1f1f1c",
        "surface-hover": "#2a2a26",
        "surface-elevated": "#252522",
        "text-primary": "#e8e6e3",
        "text-secondary": "#9b9a97",
        "text-muted": "#6f6e6b",
        luna: "#8a78e6",
        danger: "#f87171",
        warning: "#fbbf24",
      },
    },
  },
  plugins: [],
};

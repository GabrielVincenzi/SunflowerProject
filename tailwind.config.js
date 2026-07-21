const { THEME_COLORS } = require("./constants/utilities");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: THEME_COLORS,
      fontFamily: {
        "sf-extrathin": ["Elms-ExtraLight"],
        "sf-thin": ["Elms-Thin"],
        "sf-regular": ["Elms-Regular"],
        "sf-bold": ["Elms-Bold"],
        "sf-extrabold": ["Elms-ExtraBold"],
      }
    },
  },
  plugins: [],
}
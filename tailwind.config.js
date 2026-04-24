const { THEME_COLORS } = require("./constants/utilities");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: THEME_COLORS,
      fontFamily: {
        "geist-regular": ["Geist-Regular"],
        "geist-extrabold": ["Geist-ExtraBold"],
        "geist-extralight": ["Geist-ExtraLight"],
        "elms-regular": ["Elms-Regular"],
        "elms-extrabold": ["Elms-ExtraBold"],
        "elms-bold": ["Elms-Bold"],
        "elms-extralight": ["Elms-ExtraLight"],
        "elms-thin": ["Elms-Thin"],
      }
    },
  },
  plugins: [],
}
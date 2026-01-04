/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#F2BB16', // F7DA8A
        secondary: '#D99201',
        accent: '#118C8C',
        marked: '#7C8C2E',
        background: '#F0EFEC',
        dark: '#343a40',
        grey: '#495057',
        light: '#f8f9fa'
      },
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
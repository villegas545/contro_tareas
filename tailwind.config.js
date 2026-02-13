/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F97316', // Orange 500 - Main Brand (Buttons, Highlights)
          secondary: '#14B8A6', // Teal 500 - Friendly, nature-inspired (Secondary actions)
          accent: '#8B5CF6', // Violet 500 - Playful/Magic (Special items)
          cream: '#FFFBEB', // Amber 50 - Warm, sunny background
          dark: '#1C1917', // Stone 900 - Warm dark background
          surface: '#FFFFFF', // White
          text: {
            primary: '#1F2937', // Gray 800
            secondary: '#4B5563', // Gray 600
            highlight: '#C2410C', // Orange 700
            light: '#F3F4F6', // Gray 100 - Text for dark mode
            muted: '#9CA3AF', // Gray 400 - Muted text for dark mode
          }
        }
      }
    },
  },
  plugins: [],
}

import type { Config } from "tailwindcss";
const { fontFamily } = require('tailwindcss/defaultTheme');

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "loader-spinner": "#0CB16D",
        "light-grayish-blue": "#E2E8F0",
        "black": "#000000",
        "slate-gray": "#666666",
        "foggy-gray":"#9999994D",
        "light-grayish-lavender": "#CDCDD6",
        "grayish-blue": "#808091",
        "crimson-red": "#E20E0E",
        "blush-pink": "#FBE1DF",
        "pale-silver": "#F2F2F6",
        "cobalt-blue" : "#0B5EE4",
        "baby-blue": "#E3EEFF",
        "custom-white": "#fff",
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config;

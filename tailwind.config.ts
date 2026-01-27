import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/services/**/*.{js,ts}", // Include service files for dynamic classes
  ],
  safelist: [
    // Credential type colors
    "bg-emerald-600/20", "text-emerald-300", "border-emerald-500/40",
    "bg-teal-600/20", "text-teal-300", "border-teal-500/40",
    "bg-cyan-600/20", "text-cyan-300", "border-cyan-500/40",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      emerald: colors.emerald,
      teal: colors.teal,
      cyan: colors.cyan,
      indigo: colors.indigo,
      yellow: colors.yellow,
      blue: colors.blue,
      green: colors.green,
      red: colors.red,
      orange: colors.orange,
      pink: colors.pink,
      purple: colors.purple,
      // Kathryn Grayson Nanz
      text_default_color: "#fff",
      default_background_color: "#000",
    },
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;

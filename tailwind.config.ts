import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1115",
        paper: "#f7f7f5",
        accent: "#2563eb",
      },
    },
  },
  plugins: [],
};
export default config;

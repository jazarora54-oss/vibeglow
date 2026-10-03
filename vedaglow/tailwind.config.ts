import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      forest: { DEFAULT: "#0F3D26", 700: "#14502F", 500: "#1E6B3F", 100: "#E4EFE6" },
      gold: { DEFAULT: "#B8872B", light: "#D9B35C", dark: "#8A6420" },
      cream: { DEFAULT: "#FBF8F1", dark: "#F3EDDF" },
      ink: "#1F2A22",
    },
    fontFamily: { display: ["var(--font-display)", "Georgia", "serif"], sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    boxShadow: { card: "0 2px 14px rgba(15,61,38,.07)", lift: "0 10px 30px rgba(15,61,38,.14)" },
  } },
  plugins: [],
};
export default config;

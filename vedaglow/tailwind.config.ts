import type { Config } from "tailwindcss";
// Colours are CSS variables (see app/globals.css). admin -> Brand & Logo can override them; the opacity forms like bg-forest/10 keep working.
const c = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      forest: { DEFAULT: c("forest"), 700: c("forest-700"), 500: c("forest-500"), 100: c("forest-100") },
      gold: { DEFAULT: c("gold"), light: c("gold-light"), dark: c("gold-dark") },
      cream: { DEFAULT: c("cream"), dark: c("cream-dark") },
      ink: "#1F2A22",
    },
    fontFamily: { display: ["var(--font-display)", "Georgia", "serif"], sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    boxShadow: { card: "0 2px 14px rgba(15,61,38,.07)", lift: "0 10px 30px rgba(15,61,38,.14)" },
  } },
  plugins: [],
};
export default config;

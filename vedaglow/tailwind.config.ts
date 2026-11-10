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
      ink: c("ink"),
      // readable text colours for the coloured surfaces (set by lib/theme.ts so text never matches its background)
      onforest: c("on-forest"), ongold: c("on-gold"), goldonforest: c("gold-on-forest"),
    },
    fontFamily: { display: ["var(--fd)", "Georgia", "serif"], sans: ["var(--fs)", "system-ui", "sans-serif"] },
    boxShadow: { card: "0 2px 14px rgb(var(--forest) / .07)", lift: "0 10px 30px rgb(var(--forest) / .14)" },
  } },
  plugins: [],
};
export default config;

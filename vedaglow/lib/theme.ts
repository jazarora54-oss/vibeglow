import type { SiteSettings } from "@/lib/data/defaults";
/** Brand colours (admin -> Brand & Logo). Pure helpers: the website, the admin preview and the tests all use them. */
export const isHex = (x: unknown): x is string => typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x.trim());
const rgb = (h: string): [number, number, number] => { const n = parseInt(h.trim().slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (c: number[]) => "#" + c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
/** Mix colour `h` with white (t>0) or black (t<0): |t| = how far (0..1). */
export const mix = (h: string, t: number) => { const to = t >= 0 ? 255 : 0, a = Math.abs(t); return toHex(rgb(h).map(v => v + (to - v) * a)); };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
/** WCAG contrast ratio between two colours (1 = none, 21 = black on white). */
export const contrast = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/** Readable text colour (white or near-black) for a given background. */
export const textOn = (bg: string) => contrast(bg, "#ffffff") >= contrast(bg, "#1F2A22") ? "#ffffff" : "#1F2A22";
/** Text colour for buttons / bars painted in `bg`. White whenever it is reasonably readable (keeps the original look, e.g. white on the gold button),
 *  otherwise whichever of white / near-black reads better. */
export const onColor = (bg: string) => contrast(bg, "#ffffff") >= 3 ? "#ffffff" : textOn(bg);
/** Nudges colour `fg` lighter or darker (keeping its hue) until it is readable on `bg` (contrast >= min). Falls back to white / near-black. */
export const readableOn = (fg: string, bg: string, min = 3.5): string => {
  if (contrast(fg, bg) >= min) return fg;
  const dir = lum(bg) < 0.4 ? 1 : -1; // dark background -> lighten, light background -> darken
  for (let t = 0.08; t <= 0.9; t += 0.06) { const c = mix(fg, dir * t); if (contrast(c, bg) >= min) return c; }
  return textOn(bg);
};
export const ORIGINAL = { primary: "#0F3D26", accent: "#B8872B", bg: "#FBF8F1", text: "#1F2A22" };
export type TextSize = "s" | "m" | "l";
/** Heading + body font pairs. `d` / `s` are the CSS variables that app/layout.tsx (lib/fonts.ts) defines. */
export const FONT_PAIRS: { id: string; name: string; note: string; d: string; s: string; dName: string; sName: string }[] = [
  { id: "classic", name: "Classic Luxe", note: "Elegant, the original look", d: "--font-cormorant", s: "--font-jost", dName: "Cormorant Garamond", sName: "Jost" },
  { id: "playfair", name: "Fashion Editorial", note: "Bold magazine headings", d: "--font-playfair", s: "--font-lato", dName: "Playfair Display", sName: "Lato" },
  { id: "fraunces", name: "Soft & Warm", note: "Friendly and rounded", d: "--font-fraunces", s: "--font-nunito", dName: "Fraunces", sName: "Nunito Sans" },
  { id: "modern", name: "Clean Modern", note: "Simple and sharp", d: "--font-poppins", s: "--font-inter", dName: "Poppins", sName: "Inter" },
  { id: "bodoni", name: "High Fashion", note: "Thin and stylish", d: "--font-bodoni", s: "--font-montserrat", dName: "Bodoni Moda", sName: "Montserrat" },
  { id: "royal", name: "Royal", note: "Capital-letter headings", d: "--font-cinzel", s: "--font-raleway", dName: "Cinzel", sName: "Raleway" },
  { id: "minimal", name: "Minimal", note: "Light and airy", d: "--font-outfit", s: "--font-dmsans", dName: "Outfit", sName: "DM Sans" },
  { id: "storybook", name: "Storybook", note: "Gentle and handmade", d: "--font-lora", s: "--font-quicksand", dName: "Lora", sName: "Quicksand" }];
export const fontPair = (id: unknown) => FONT_PAIRS.find(f => f.id === id) ?? FONT_PAIRS[0];
/** Ready-made looks. One click sets colours, text colour and a matching font; 3D is a separate switch and works with every theme. */
export interface Theme { id: string; name: string; tag: string; primary: string; accent: string; bg: string; text: string; font: string }
export const THEMES: Theme[] = [
  { id: "original", name: "VedaGlow Original", tag: "Forest green & gold", primary: "#0F3D26", accent: "#B8872B", bg: "#FBF8F1", text: "#1F2A22", font: "classic" },
  { id: "rose", name: "Rose Glow", tag: "Berry rose & blush", primary: "#8C1D54", accent: "#C2416C", bg: "#FFF5F8", text: "#2B1420", font: "playfair" },
  { id: "royal", name: "Royal Gold", tag: "Navy ink & rich gold", primary: "#14213D", accent: "#B07D0A", bg: "#FAF7EE", text: "#171B2A", font: "royal" },
  { id: "ocean", name: "Ocean Breeze", tag: "Deep sea & aqua", primary: "#0B3C5D", accent: "#0F8B9C", bg: "#F1F9FB", text: "#0E2430", font: "modern" },
  { id: "midnight", name: "Midnight Luxe", tag: "Violet night & neon lilac", primary: "#1B1238", accent: "#7C3AED", bg: "#F6F3FD", text: "#1A1530", font: "bodoni" },
  { id: "sunset", name: "Sunset Glow", tag: "Burnt amber & coral", primary: "#7A2E1D", accent: "#DB4F26", bg: "#FFF6EE", text: "#2E1A14", font: "fraunces" },
  { id: "emerald", name: "Emerald Spa", tag: "Fresh emerald & mint", primary: "#064E3B", accent: "#0B8A5F", bg: "#F1FBF5", text: "#0F2A21", font: "minimal" },
  { id: "lavender", name: "Lavender Dream", tag: "Soft purple & orchid", primary: "#5B3A91", accent: "#B0459E", bg: "#FAF6FE", text: "#241A36", font: "storybook" },
  { id: "mocha", name: "Mocha Cream", tag: "Chocolate & caramel", primary: "#4A2C1D", accent: "#B2703A", bg: "#FCF6EE", text: "#2A1B13", font: "playfair" },
  { id: "charcoal", name: "Charcoal & Copper", tag: "Slate & copper", primary: "#2B2B2B", accent: "#B4662B", bg: "#F8F6F2", text: "#222222", font: "modern" }];
export const themeById = (id: unknown) => THEMES.find(t => t.id === id);
/** The text colour used when the owner has not chosen one: the theme's own, else the original, else a very dark tint of the main colour. */
export const autoText = (primary: string, bg: string, themeId?: string): string => {
  const t = themeById(themeId); if (t) return t.text;
  if (!isHex(primary)) return ORIGINAL.text;
  const c = mix(primary, -0.62); return contrast(c, isHex(bg) ? bg : ORIGINAL.bg) >= 7 ? c : ORIGINAL.text;
};
export const PRESETS = THEMES; // kept so older imports still work
const triple = (h: string) => rgb(h).join(" ");
export type ThemeSettings = Partial<Pick<SiteSettings, "color_primary" | "color_accent" | "color_bg" | "color_text" | "theme_id" | "font_id" | "text_size">>;
/** CSS that overrides the colour / font variables. "" when nothing is customised (the originals in globals.css stay).
 *  Besides the colours it sets the READABLE text colour for every coloured surface, so text never matches its background. */
export function themeVars(s: ThemeSettings): [string, string][] {
  const v: [string, string][] = []; const custom = isHex(s.color_primary) || isHex(s.color_accent) || isHex(s.color_bg) || isHex(s.color_text) || !!themeById(s.theme_id);
  const p = isHex(s.color_primary) ? s.color_primary : ORIGINAL.primary, a = isHex(s.color_accent) ? s.color_accent : ORIGINAL.accent, b = isHex(s.color_bg) ? s.color_bg : ORIGINAL.bg;
  if (isHex(s.color_primary)) v.push(["--forest", triple(p)], ["--forest-700", triple(mix(p, 0.08))], ["--forest-500", triple(mix(p, 0.22))], ["--forest-100", triple(mix(p, 0.9))]);
  if (isHex(s.color_accent)) v.push(["--gold", triple(a)], ["--gold-light", triple(mix(a, 0.3))], ["--gold-dark", triple(mix(a, -0.28))]);
  if (isHex(s.color_bg)) v.push(["--cream", triple(b)], ["--cream-dark", triple(mix(b, -0.035))]);
  if (custom) {
    v.push(["--on-forest", triple(onColor(p))], ["--on-gold", triple(onColor(a))], ["--gold-on-forest", triple(readableOn(mix(a, 0.3), p, 3.5))]);
    const ink = isHex(s.color_text) ? s.color_text : autoText(isHex(s.color_primary) ? p : "", b, s.theme_id); v.push(["--ink", triple(ink)]);
  }
  const f = FONT_PAIRS.find(x => x.id === s.font_id); if (f && f.id !== "classic") v.push(["--fd", `var(${f.d})`], ["--fs", `var(${f.s})`]);
  return v;
}
export function themeCss(s: ThemeSettings): string {
  const v = themeVars(s); const out: string[] = []; if (v.length) out.push(`:root{${v.map(([k, x]) => `${k}:${x}`).join(";")}}`);
  if (s.text_size === "s") out.push("html{font-size:93.75%}"); else if (s.text_size === "l") out.push("html{font-size:108%}");
  return out.join("");
}
/** Problems with a colour choice: "block" = unreadable (cannot be saved), "warn" = readable but weak.
 *  Text ON the main / accent colour is chosen automatically (white or dark), so those only need to stay readable as headings / prices on the page. */
export function colorIssues(p: string, a: string, b: string, t = ""): { level: "block" | "warn"; text: string }[] {
  const out: { level: "block" | "warn"; text: string }[] = []; const bg = isHex(b) ? b : ORIGINAL.bg;
  if (isHex(p)) { const c = contrast(p, bg); if (c < 3) out.push({ level: "block", text: "Main colour is too light: headings and links in this colour would be hard to read on the page background. Choose a darker colour." }); else if (c < 4.5) out.push({ level: "warn", text: "Main colour is a little light for headings. It works, but a darker colour is easier to read." }); }
  if (isHex(a)) { const c = contrast(a, bg); if (c < 1.8) out.push({ level: "block", text: "Accent colour is too light: prices and highlights would almost disappear on the page background. Choose a stronger colour." }); else if (c < 3) out.push({ level: "warn", text: "Accent colour is on the light side for prices and small highlights." }); }
  if (isHex(b)) { const c = contrast(b, isHex(t) ? t : ORIGINAL.text); if (c < 7 && !isHex(t)) out.push({ level: "block", text: "Page background is too dark: the normal dark text would not be readable. Choose a light background." }); }
  if (isHex(t)) { const c = contrast(t, bg); if (c < 3.5) out.push({ level: "block", text: "Text colour is too close to the page background: the writing would be hard to read. Choose a darker (or stronger) text colour." }); else if (c < 4.5) out.push({ level: "warn", text: "Text colour is a bit weak against the page background. A darker text colour is easier to read." }); if (contrast(t, "#ffffff") < 3.5) out.push({ level: "block", text: "Text colour is too light for the white boxes and cards. Choose a darker text colour." }); }
  return out;
}

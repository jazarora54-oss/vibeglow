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
export const ORIGINAL = { primary: "#0F3D26", accent: "#B8872B", bg: "#FBF8F1" };
export const PRESETS: { name: string; primary: string; accent: string; bg: string }[] = [
  { name: "VedaGlow green & gold (original)", ...ORIGINAL },
  { name: "Deep blue & gold", primary: "#12355B", accent: "#B8872B", bg: "#F7F9FC" },
  { name: "Maroon & rose gold", primary: "#6B1D2A", accent: "#B76E79", bg: "#FCF7F5" },
  { name: "Charcoal & copper", primary: "#2B2B2B", accent: "#B4662B", bg: "#F8F6F2" }];
const triple = (h: string) => rgb(h).join(" ");
/** CSS that overrides the colour variables. "" when nothing is customised (the original colours in globals.css stay). */
export function themeCss(s: Pick<SiteSettings, "color_primary" | "color_accent" | "color_bg">): string {
  const v: string[] = [];
  if (isHex(s.color_primary)) { const p = s.color_primary; v.push(`--forest:${triple(p)}`, `--forest-700:${triple(mix(p, 0.08))}`, `--forest-500:${triple(mix(p, 0.22))}`, `--forest-100:${triple(mix(p, 0.9))}`); }
  if (isHex(s.color_accent)) { const a = s.color_accent; v.push(`--gold:${triple(a)}`, `--gold-light:${triple(mix(a, 0.3))}`, `--gold-dark:${triple(mix(a, -0.28))}`); }
  if (isHex(s.color_bg)) { const b = s.color_bg; v.push(`--cream:${triple(b)}`, `--cream-dark:${triple(mix(b, -0.035))}`); }
  return v.length ? `:root{${v.join(";")}}` : "";
}
/** Problems with a colour choice: "block" = unreadable (cannot be saved), "warn" = readable but weak. */
export function colorIssues(p: string, a: string, b: string): { level: "block" | "warn"; text: string }[] {
  const out: { level: "block" | "warn"; text: string }[] = [];
  if (isHex(p)) { const c = contrast(p, "#ffffff"); if (c < 3) out.push({ level: "block", text: "Main colour is too light: the white text on buttons and the menu would be hard to read. Choose a darker colour." }); else if (c < 4.5) out.push({ level: "warn", text: "Main colour is a little light for white text. It works, but a darker colour is easier to read." }); }
  if (isHex(a)) { const c = contrast(a, "#ffffff"); if (c < 2.5) out.push({ level: "block", text: "Accent colour is too light: white text on gold buttons would be hard to read. Choose a darker colour." }); else if (c < 3.5) out.push({ level: "warn", text: "Accent colour is on the light side for white button text." }); }
  if (isHex(b)) { const c = contrast(b, "#1F2A22"); if (c < 7) out.push({ level: "block", text: "Page background is too dark: the normal dark text would not be readable. Choose a light background." }); }
  return out;
}

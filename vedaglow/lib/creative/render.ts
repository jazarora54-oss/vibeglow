/** Built-in creative generator (runs in the browser with the canvas: free, no AI, no external service).
 *  Makes banners and social posters from ONE photo + a few words. Text is always YOUR text; nothing is invented. */
export type Template = "auto" | "left-panel" | "center" | "bottom-bar" | "split" | "photo-only";
export interface Brand { primary: string; accent: string; cream: string; display: string; sans: string }
export const DEFAULT_BRAND: Brand = { primary: "#0F3D26", accent: "#B8872B", cream: "#FBF8F1", display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", sans: "Jost, 'Segoe UI', Arial, sans-serif" };
export interface Spec { w: number; h: number; label: string }
/** Sizes from the spec. "site" ones are saved to the homepage banners; the rest are for download / social. */
export const BANNER_SIZES: Record<string, Spec> = { desktop: { w: 1920, h: 650, label: "Homepage desktop 1920×650" }, mobile: { w: 750, h: 950, label: "Homepage mobile 750×950" }, wide: { w: 1200, h: 500, label: "Wide 1200×500" }, mid: { w: 1600, h: 600, label: "Wide 1600×600" } };
export const POSTER_SIZES: Record<string, Spec> = { square: { w: 1080, h: 1080, label: "Square 1080×1080 (Instagram / Facebook)" }, portrait: { w: 1080, h: 1350, label: "Portrait 1080×1350 (Instagram)" }, story: { w: 1080, h: 1920, label: "Story / Reel 1080×1920" }, landscape: { w: 1200, h: 630, label: "Landscape 1200×630 (Facebook / LinkedIn)" }, pin: { w: 1000, h: 1500, label: "Pinterest 1000×1500" } };
export interface Copy { headline: string; sub: string; cta: string }
export interface Options { template: Template; focusX: number; focusY: number; brand?: Brand; copy: Copy }

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Source rectangle that makes the photo cover w×h, centred on the focus point (0..1). */
export function coverRect(iw: number, ih: number, w: number, h: number, fx = 0.5, fy = 0.5) {
  const k = Math.max(w / iw, h / ih); const sw = w / k, sh = h / k;
  return { sx: clamp(fx * iw - sw / 2, 0, iw - sw), sy: clamp(fy * ih - sh / 2, 0, ih - sh), sw, sh };
}
/** Greedy word wrap (pure, so it can be unit tested). measure() returns text width. */
export function wrapText(text: string, maxW: number, measure: (s: string) => number, maxLines: number): string[] {
  const words = String(text ?? "").split(/\s+/).filter(Boolean); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (measure(t) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur); if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] = keep[maxLines - 1].replace(/[\s.,;:!?-]*$/, "") + "…"; return keep; }
  return lines;
}
/** "auto" picks a layout from the shape: wide -> split, tall/square -> bottom panel look via left-panel with strong gradient. */
export function pickTemplate(t: Template, w: number, h: number): Exclude<Template, "auto"> { if (t !== "auto") return t; return w / h >= 2 ? "left-panel" : w / h >= 1.4 ? "split" : "bottom-bar"; }

type Ctx = CanvasRenderingContext2D;
const pill = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

function drawText(c: Ctx, o: Options, brand: Brand, box: { x: number; y: number; w: number; h: number }, align: CanvasTextAlign, S: number, bottom = false) {
  const { headline, sub, cta } = o.copy; const hs = Math.round(S * 0.085), ss = Math.round(S * 0.034), cs = Math.round(S * 0.03);
  c.textAlign = align; c.textBaseline = "alphabetic"; const ax = align === "center" ? box.x + box.w / 2 : box.x;
  c.font = `600 ${hs}px ${brand.display}`; const hl = headline.trim() ? wrapText(headline.trim(), box.w, s => c.measureText(s).width, 3) : [];
  c.font = `400 ${ss}px ${brand.sans}`; const sl = sub.trim() ? wrapText(sub.trim(), box.w, s => c.measureText(s).width, 3) : [];
  const ctaH = cta.trim() ? cs * 2.3 : 0; const total = hl.length * hs * 1.1 + (sl.length ? sl.length * ss * 1.4 + ss * 0.6 : 0) + (ctaH ? ctaH + ss : 0);
  let y = (bottom ? box.y + box.h - total : box.y + (box.h - total) / 2) + hs; c.fillStyle = brand.cream; c.font = `600 ${hs}px ${brand.display}`;
  for (const l of hl) { c.fillText(l, ax, y); y += hs * 1.1; } y += sl.length ? ss * 0.2 : 0;
  c.font = `400 ${ss}px ${brand.sans}`; c.globalAlpha = 0.92; for (const l of sl) { y += ss * 0.2; c.fillText(l, ax, y); y += ss * 1.2; } c.globalAlpha = 1;
  if (cta.trim()) { c.font = `600 ${cs}px ${brand.sans}`; const tw = c.measureText(cta.trim().toUpperCase()).width + cs * 2.4; const bx = align === "center" ? ax - tw / 2 : ax; const by = y + ss * 0.4;
    c.fillStyle = brand.accent; pill(c, bx, by, tw, ctaH, ctaH / 2); c.fill(); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(cta.trim().toUpperCase(), bx + tw / 2, by + ctaH / 2 + cs * 0.35); }
}

/** Draws the creative on a canvas of w×h. `img` is any CanvasImageSource with known size. */
export function drawCreative(c: Ctx, img: { width: number; height: number } & CanvasImageSource, w: number, h: number, o: Options) {
  const brand = o.brand ?? DEFAULT_BRAND; const t = pickTemplate(o.template, w, h); const S = Math.min(w, h * 1.6); const pad = Math.round(Math.min(w, h * 1.7) * 0.06);
  c.clearRect(0, 0, w, h); c.fillStyle = brand.primary; c.fillRect(0, 0, w, h);
  const photo = (x: number, y: number, pw: number, ph: number) => { const r = coverRect(img.width, img.height, pw, ph, o.focusX, o.focusY); c.drawImage(img, r.sx, r.sy, r.sw, r.sh, x, y, pw, ph); };
  const has = Boolean(o.copy.headline.trim() || o.copy.sub.trim() || o.copy.cta.trim());
  if (t === "photo-only" || !has) { photo(0, 0, w, h); return; }
  if (t === "split") { const pw = Math.round(w * 0.45); c.fillStyle = brand.primary; c.fillRect(0, 0, pw, h); photo(pw, 0, w - pw, h); drawText(c, o, brand, { x: pad, y: pad, w: pw - pad * 1.6, h: h - pad * 2 }, "left", S); return; }
  photo(0, 0, w, h);
  if (t === "left-panel") { const g = c.createLinearGradient(0, 0, w * 0.62, 0); g.addColorStop(0, hexA(brand.primary, 0.92)); g.addColorStop(0.7, hexA(brand.primary, 0.6)); g.addColorStop(1, hexA(brand.primary, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); drawText(c, o, brand, { x: pad, y: pad, w: w * 0.46, h: h - pad * 2 }, "left", S); return; }
  if (t === "center") { c.fillStyle = hexA(brand.primary, 0.45); c.fillRect(0, 0, w, h); drawText(c, o, brand, { x: w * 0.12, y: pad, w: w * 0.76, h: h - pad * 2 }, "center", S); return; }
  const bh = Math.round(h * (h > w ? 0.34 : 0.42)); const g = c.createLinearGradient(0, h - bh * 1.4, 0, h); g.addColorStop(0, hexA(brand.primary, 0)); g.addColorStop(0.45, hexA(brand.primary, 0.85)); g.addColorStop(1, hexA(brand.primary, 0.96)); c.fillStyle = g; c.fillRect(0, h - bh * 1.4, w, bh * 1.4);
  drawText(c, o, brand, { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 }, "left", S, true);
}
export function hexA(hex: string, a: number) { const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return `rgba(15,61,38,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

/** Browser only: renders to a WebP blob (quality lowered until it is under maxKB so pages stay fast). */
export async function renderWebp(img: ImageBitmap | HTMLImageElement, spec: Spec, o: Options, maxKB = 450): Promise<Blob> {
  const cv = document.createElement("canvas"); cv.width = spec.w; cv.height = spec.h; const c = cv.getContext("2d")!; drawCreative(c, img as ImageBitmap, spec.w, spec.h, o);
  let q = 0.86; for (;;) { const b: Blob | null = await new Promise(res => cv.toBlob(res, "image/webp", q)); if (!b) throw new Error("Could not create the image in this browser."); if (b.size <= maxKB * 1024 || q <= 0.5) return b; q -= 0.08; }
}
export async function loadBitmap(src: Blob | string): Promise<ImageBitmap> {
  if (typeof src === "string") { const r = await fetch(src, { mode: "cors" }); if (!r.ok) throw new Error("Could not load that picture."); return createImageBitmap(await r.blob()); }
  return createImageBitmap(src);
}
/** Browser only: JPEG (what Instagram needs). */
export async function renderJpeg(img: ImageBitmap | HTMLImageElement, spec: Spec, o: Options): Promise<Blob> {
  const cv = document.createElement("canvas"); cv.width = spec.w; cv.height = spec.h; const c = cv.getContext("2d")!; c.fillStyle = "#fff"; c.fillRect(0, 0, spec.w, spec.h); drawCreative(c, img as ImageBitmap, spec.w, spec.h, o);
  const b: Blob | null = await new Promise(res => cv.toBlob(res, "image/jpeg", 0.88)); if (!b) throw new Error("Could not create the picture in this browser."); return b;
}

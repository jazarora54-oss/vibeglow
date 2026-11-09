/** Built-in creative generator (runs in the browser with the canvas: free, no AI, no external service).
 *  Makes banners and social posters from ONE photo + a few words. Text is always YOUR text; nothing is invented. */
export type Template = "auto" | "showcase" | "left-panel" | "center" | "bottom-bar" | "split" | "photo-only";
export interface Brand { primary: string; accent: string; cream: string; display: string; sans: string }
export const DEFAULT_BRAND: Brand = { primary: "#0F3D26", accent: "#B8872B", cream: "#FBF8F1", display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", sans: "Jost, 'Segoe UI', Arial, sans-serif" };
/** Reads the colours set in admin -> Brand & Logo (CSS variables on the page) so banners made in the studio match the site. Falls back to the built-in colours. */
export function brandFromTheme(): Brand {
  if (typeof document === "undefined") return DEFAULT_BRAND;
  const cs = getComputedStyle(document.documentElement); const hex = (v: string, d: string) => { const m = v.trim().match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/); return m ? "#" + [m[1], m[2], m[3]].map(x => Math.min(255, Number(x)).toString(16).padStart(2, "0")).join("") : d; };
  return { ...DEFAULT_BRAND, primary: hex(cs.getPropertyValue("--forest"), DEFAULT_BRAND.primary), accent: hex(cs.getPropertyValue("--gold"), DEFAULT_BRAND.accent), cream: hex(cs.getPropertyValue("--cream"), DEFAULT_BRAND.cream) };
}
export interface Spec { w: number; h: number; label: string }
/** Sizes from the spec. "site" ones are saved to the homepage banners; the rest are for download / social. */
export const BANNER_SIZES: Record<string, Spec> = { desktop: { w: 1920, h: 650, label: "Homepage desktop 1920×650" }, mobile: { w: 750, h: 950, label: "Homepage mobile 750×950" }, wide: { w: 1200, h: 500, label: "Wide 1200×500" }, mid: { w: 1600, h: 600, label: "Wide 1600×600" } };
export const POSTER_SIZES: Record<string, Spec> = { square: { w: 1080, h: 1080, label: "Square 1080×1080 (Instagram / Facebook)" }, portrait: { w: 1080, h: 1350, label: "Portrait 1080×1350 (Instagram)" }, story: { w: 1080, h: 1920, label: "Story / Reel 1080×1920" }, landscape: { w: 1200, h: 630, label: "Landscape 1200×630 (Facebook / LinkedIn)" }, pin: { w: 1000, h: 1500, label: "Pinterest 1000×1500" } };
export interface Copy { headline: string; sub: string; cta: string; bullets?: string[]; badge?: string }
export type Mood = "auto" | "warm" | "rose" | "green" | "gold" | "blue";
export const MOODS: Mood[] = ["auto", "warm", "rose", "green", "gold", "blue"];
export const MOOD_RGB: Record<Exclude<Mood, "auto">, [number, number, number]> = { warm: [236, 200, 160], rose: [236, 175, 195], green: [170, 205, 170], gold: [235, 205, 120], blue: [170, 200, 230] };
export interface Options { template: Template; focusX: number; focusY: number; brand?: Brand; copy: Copy; mood?: Mood }

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
export function pickTemplate(t: Template, _w: number, _h: number): Exclude<Template, "auto"> { return t === "auto" ? "showcase" : t; }
/** Picks a small icon for a bullet from its words (pure, unit tested). */
export type IconKind = "sun" | "drop" | "leaf" | "shield" | "heart" | "sparkle";
export function iconFor(text: string): IconKind {
  const t = String(text ?? "").toLowerCase();
  if (/\b(sun|spf|uv|bright|glow|radian|shine)/.test(t)) return "sun"; if (/(water|hydrat|moist|drop|serum|oil|nourish)/.test(t)) return "drop";
  if (/(natural|herb|ayurved|plant|leaf|organic|botanic|neem|aloe|vegan)/.test(t)) return "leaf"; if (/(gentle|safe|protect|tested|free|sensitive|pure)/.test(t)) return "shield";
  if (/(love|care|soft|smooth|heal|calm)/.test(t)) return "heart"; return "sparkle";
}

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

/** Small canvas icon (about 1 unit = r). */
function icon(c: Ctx, k: IconKind, cx: number, cy: number, r: number, col: string) {
  c.save(); c.translate(cx, cy); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(2, r * 0.16); c.lineCap = "round"; c.lineJoin = "round"; c.beginPath();
  if (k === "sun") { c.arc(0, 0, r * 0.32, 0, 7); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); c.stroke(); } }
  else if (k === "drop") { c.moveTo(0, -r * 0.75); c.bezierCurveTo(r * 0.7, 0, r * 0.6, r * 0.7, 0, r * 0.7); c.bezierCurveTo(-r * 0.6, r * 0.7, -r * 0.7, 0, 0, -r * 0.75); c.stroke(); }
  else if (k === "leaf") { c.moveTo(-r * 0.6, r * 0.6); c.bezierCurveTo(-r * 0.7, -r * 0.5, r * 0.1, -r * 0.8, r * 0.7, -r * 0.7); c.bezierCurveTo(r * 0.8, r * 0.1, r * 0.1, r * 0.8, -r * 0.6, r * 0.6); c.stroke(); c.beginPath(); c.moveTo(-r * 0.6, r * 0.6); c.lineTo(r * 0.3, -r * 0.3); c.stroke(); }
  else if (k === "shield") { c.moveTo(0, -r * 0.75); c.lineTo(r * 0.6, -r * 0.5); c.lineTo(r * 0.55, r * 0.15); c.quadraticCurveTo(r * 0.4, r * 0.55, 0, r * 0.8); c.quadraticCurveTo(-r * 0.4, r * 0.55, -r * 0.55, r * 0.15); c.lineTo(-r * 0.6, -r * 0.5); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(-r * 0.22, 0); c.lineTo(-r * 0.04, r * 0.2); c.lineTo(r * 0.28, -r * 0.2); c.stroke(); }
  else if (k === "heart") { c.moveTo(0, r * 0.7); c.bezierCurveTo(-r * 1.0, -r * 0.1, -r * 0.5, -r * 0.8, 0, -r * 0.3); c.bezierCurveTo(r * 0.5, -r * 0.8, r * 1.0, -r * 0.1, 0, r * 0.7); c.stroke(); }
  else { c.moveTo(0, -r * 0.8); c.quadraticCurveTo(r * 0.1, -r * 0.1, r * 0.8, 0); c.quadraticCurveTo(r * 0.1, r * 0.1, 0, r * 0.8); c.quadraticCurveTo(-r * 0.1, r * 0.1, -r * 0.8, 0); c.quadraticCurveTo(-r * 0.1, -r * 0.1, 0, -r * 0.8); c.fill(); }
  c.restore();
}
/** Deterministic pseudo-random so a banner looks the same every time it is drawn. */
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** "Showcase": soft pastel background taken from the photo, the photo as a rounded card (never stretched or cut), headline, icon bullets, gold badge, button. */
function drawShowcase(c: Ctx, img: { width: number; height: number } & CanvasImageSource, w: number, h: number, o: Options, brand: Brand) {
  const wide = w / h >= 1.25; const S = wide ? Math.min(w * 0.6, h * 1.7) : w * 0.95; const pad = Math.round((wide ? h : w) * (wide ? 0.09 : 0.07)); const ink = brand.primary;
  // 1. pastel background from the photo's own colours
  let r = 245, g = 238, b = 225;
  try { const t = document.createElement("canvas"); t.width = 16; t.height = 16; const tc = t.getContext("2d")!; tc.drawImage(img, 0, 0, 16, 16); const d = tc.getImageData(0, 0, 16, 16).data; let n = 0, rr = 0, gg = 0, bb = 0; for (let i = 0; i < d.length; i += 4) { rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; } r = rr / n; g = gg / n; b = bb / n; } catch { /* keep the cream */ }
  if (o.mood && o.mood !== "auto") [r, g, b] = MOOD_RGB[o.mood];
  const mix = (v: number, k: number) => Math.round(v + (255 - v) * k); const p1 = `rgb(${mix(r, 0.82)},${mix(g, 0.82)},${mix(b, 0.82)})`, p2 = `rgb(${mix(r, 0.6)},${mix(g, 0.62)},${mix(b, 0.66)})`;
  const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, p1); bg.addColorStop(1, p2); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  try { const bl = document.createElement("canvas"); bl.width = 24; bl.height = Math.max(8, Math.round(24 * h / w)); const bc = bl.getContext("2d")!; const cr = coverRect(img.width, img.height, bl.width, bl.height); bc.drawImage(img, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, bl.width, bl.height); c.save(); c.globalAlpha = 0.28; c.imageSmoothingEnabled = true; c.drawImage(bl, 0, 0, w, h); c.restore(); } catch { /* optional */ }
  // 2. decoration: soft bokeh circles + sparkles
  for (let i = 0; i < 14; i++) { const x = rnd(i + 1) * w, y = rnd(i + 50) * h, rad = (0.012 + rnd(i + 90) * 0.05) * Math.min(w, h * 1.6); const rg = c.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, "rgba(255,255,255,0.75)"); rg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = rg; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); }
  c.strokeStyle = hexA(brand.accent, 0.35); c.lineWidth = Math.max(2, S * 0.004); c.beginPath(); c.arc(wide ? w * 0.78 : w * 0.5, wide ? h * 0.5 : h * 0.72, Math.min(w, h) * 0.46, 0, 7); c.stroke();
  for (let i = 0; i < 5; i++) { const sx = wide ? w * (0.52 + rnd(i + 200) * 0.46) : w * (0.04 + rnd(i + 200) * 0.92), sy = wide ? h * (0.06 + rnd(i + 300) * 0.88) : h * (0.5 + rnd(i + 300) * 0.48); icon(c, "sparkle", sx, sy, Math.min(w, h) * (0.014 + rnd(i + 400) * 0.014), hexA(brand.accent, 0.8)); }
  // 3. regions
  const tb = wide ? { x: pad, y: pad * 0.7, w: w * 0.5 - pad, h: h - pad * 1.4 } : { x: pad, y: pad, w: w - pad * 2, h: h * 0.44 - pad };
  const pb = wide ? { x: w * 0.54, y: pad * 0.8, w: w * 0.46 - pad, h: h - pad * 1.6 } : { x: pad, y: h * 0.44, w: w - pad * 2, h: h * 0.56 - pad };
  // 4. photo card (fits, never stretched)
  const k = Math.min(pb.w / img.width, pb.h / img.height); const cw = img.width * k, ch = img.height * k; const cx = pb.x + (pb.w - cw) / 2, cy = pb.y + (pb.h - ch) / 2; const rad = Math.min(cw, ch) * 0.06;
  c.save(); c.shadowColor = "rgba(20,30,20,0.28)"; c.shadowBlur = S * 0.05; c.shadowOffsetY = S * 0.02; c.fillStyle = "#fff"; pill(c, cx, cy, cw, ch, rad); c.fill(); c.restore();
  c.save(); pill(c, cx, cy, cw, ch, rad); c.clip(); c.drawImage(img, cx, cy, cw, ch); c.restore();
  c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = Math.max(3, S * 0.006); pill(c, cx, cy, cw, ch, rad); c.stroke();
  // 5. text
  const { headline, sub, cta, bullets, badge } = o.copy; const bl = (bullets ?? []).map(x => x.trim()).filter(Boolean).slice(0, 3);
  let hs = 0, ss = 0, bs = 0, cs = 0, hl: string[] = [], sl: string[] = [], bLines: string[][] = [], ic = 0, ctaH = 0, bH = 0, total = 0, colW = tb.w / Math.max(1, bl.length);
  c.textAlign = "left"; c.textBaseline = "alphabetic";
  for (let f = 1; f >= 0.4; f -= 0.06) { // shrink everything a little until it fits the space
    hs = Math.round((wide ? S * 0.105 : S * 0.085) * f); ss = Math.round(hs * 0.38); bs = Math.round(hs * 0.3); cs = Math.round(hs * 0.3);
    c.font = `600 ${hs}px ${brand.display}`; hl = headline.trim() ? wrapText(headline.trim(), tb.w, s => c.measureText(s).width, wide ? 3 : 2) : [];
    c.font = `400 ${ss}px ${brand.sans}`; sl = sub.trim() ? wrapText(sub.trim(), tb.w, s => c.measureText(s).width, 2) : [];
    ic = bs * 2.1; bLines = bl.map(t => { c.font = `500 ${bs}px ${brand.sans}`; return wrapText(t, colW - ic - bs * 0.6, s => c.measureText(s).width, 2); });
    ctaH = cta.trim() ? cs * 2.4 : 0; bH = bl.length ? Math.max(ic, ...bLines.map(x => x.length * bs * 1.25)) : 0;
    total = hs * 0.9 + hl.length * hs * 1.08 + (sl.length ? ss * 0.1 + sl.length * ss * 1.4 : 0) + (bH ? hs * 0.15 + bH + hs * 0.2 : 0) + (ctaH ? hs * 0.2 + ctaH : 0);
    if (total <= tb.h) break;
  }
  let y = (wide ? tb.y + Math.max(0, (tb.h - total) / 2) : tb.y) + hs * 0.9;
  c.fillStyle = ink; c.font = `600 ${hs}px ${brand.display}`; for (const l of hl) { c.fillText(l, tb.x, y); y += hs * 1.08; }
  if (sl.length) { y += ss * 0.1; c.font = `400 ${ss}px ${brand.sans}`; c.globalAlpha = 0.85; for (const l of sl) { c.fillText(l, tb.x, y); y += ss * 1.4; } c.globalAlpha = 1; }
  if (bH) { y += hs * 0.15; bl.forEach((_, i) => { const bx = tb.x + i * colW; c.fillStyle = hexA(brand.accent, 0.18); c.beginPath(); c.arc(bx + ic / 2, y + ic / 2, ic / 2, 0, 7); c.fill(); icon(c, iconFor(bl[i]), bx + ic / 2, y + ic / 2, ic * 0.38, ink); c.fillStyle = ink; c.font = `500 ${bs}px ${brand.sans}`; bLines[i].forEach((l, j) => c.fillText(l, bx + ic + bs * 0.5, y + (ic - bLines[i].length * bs * 1.25) / 2 + bs * 1.0 + j * bs * 1.25)); }); y += bH + hs * 0.2; }
  if (ctaH) { y += hs * 0.2; c.font = `600 ${cs}px ${brand.sans}`; const label = cta.trim().toUpperCase(); const tw = c.measureText(label).width + cs * 3; c.save(); c.shadowColor = hexA(brand.accent, 0.4); c.shadowBlur = cs * 0.8; c.shadowOffsetY = cs * 0.25; c.fillStyle = brand.accent; pill(c, tb.x, y, tw, ctaH, ctaH / 2); c.fill(); c.restore(); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(label, tb.x + tw / 2, y + ctaH / 2 + cs * 0.35); c.textAlign = "left"; }
  // 6. gold badge on the card corner
  const bt = (badge ?? "").trim().slice(0, 14); if (bt) { const br = Math.min(cw, ch) * 0.17; const bx = cx + cw - br * 0.35, by = cy + br * 0.35; const gg2 = c.createLinearGradient(bx - br, by - br, bx + br, by + br); gg2.addColorStop(0, "#E6C46A"); gg2.addColorStop(1, brand.accent);
    c.save(); c.shadowColor = "rgba(0,0,0,0.3)"; c.shadowBlur = br * 0.3; c.shadowOffsetY = br * 0.1; c.fillStyle = gg2; c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill(); c.restore(); c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = Math.max(2, br * 0.06); c.beginPath(); c.arc(bx, by, br * 0.84, 0, 7); c.stroke();
    let fs = br * 0.62; c.font = `700 ${fs}px ${brand.display}`; while (c.measureText(bt).width > br * 1.35 && fs > 10) { fs -= 2; c.font = `700 ${fs}px ${brand.display}`; } c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(bt, bx, by + fs * 0.32); c.textAlign = "left"; }
}

/** Draws the creative on a canvas of w×h. `img` is any CanvasImageSource with known size. */
export function drawCreative(c: Ctx, img: { width: number; height: number } & CanvasImageSource, w: number, h: number, o: Options) {
  const brand = o.brand ?? DEFAULT_BRAND; const t = pickTemplate(o.template, w, h); const S = Math.min(w, h * 1.6); const pad = Math.round(Math.min(w, h * 1.7) * 0.06);
  c.clearRect(0, 0, w, h); c.fillStyle = brand.primary; c.fillRect(0, 0, w, h);
  const photo = (x: number, y: number, pw: number, ph: number) => { const r = coverRect(img.width, img.height, pw, ph, o.focusX, o.focusY); c.drawImage(img, r.sx, r.sy, r.sw, r.sh, x, y, pw, ph); };
  const has = Boolean(o.copy.headline.trim() || o.copy.sub.trim() || o.copy.cta.trim());
  if (t === "photo-only" || !has) { photo(0, 0, w, h); return; }
  if (t === "showcase") { drawShowcase(c, img, w, h, o, brand); return; }
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

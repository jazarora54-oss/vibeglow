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
export interface Copy { headline: string; sub: string; cta: string; bullets?: string[]; badge?: string; /** small pill above the headline, e.g. “Limited time offer” */ tag?: string }
export type Mood = "auto" | "warm" | "rose" | "green" | "gold" | "blue" | "lavender" | "mint" | "aqua" | "blush-pink" | "sunset" | "berry" | "navy" | "emerald";
export const MOODS: Mood[] = ["auto", "warm", "rose", "green", "gold", "blue", "lavender", "mint", "aqua", "blush-pink", "sunset", "berry", "navy", "emerald"];
/** Soft pastel backgrounds (base colour is lightened). */
export const MOOD_RGB: Record<Exclude<Mood, "auto" | "blush-pink" | "sunset" | "berry" | "navy" | "emerald">, [number, number, number]> = { warm: [236, 200, 160], rose: [236, 175, 195], green: [170, 205, 170], gold: [235, 205, 120], blue: [170, 200, 230], lavender: [205, 188, 236], mint: [170, 224, 200], aqua: [160, 218, 228] };
/** Rich, saturated backgrounds (white text, white button), like a beauty-brand ad. */
export const VIVID: Partial<Record<Mood, { c1: string; c2: string }>> = { "blush-pink": { c1: "#F7A07C", c2: "#C2185B" }, sunset: { c1: "#FFB05A", c2: "#E0457B" }, berry: { c1: "#8E44F0", c2: "#E5389D" }, navy: { c1: "#2C4F7C", c2: "#0B1D3A" }, emerald: { c1: "#2E9B6F", c2: "#0B3D2E" } };
export const MOOD_LABELS: [Mood, string][] = [["auto", "Automatic (from photo)"], ["warm", "Warm peach"], ["rose", "Soft rose"], ["green", "Fresh green"], ["gold", "Gold"], ["blue", "Cool blue"], ["lavender", "Lavender"], ["mint", "Mint"], ["aqua", "Aqua"], ["blush-pink", "Rich pink (peach → magenta)"], ["sunset", "Sunset orange-pink"], ["berry", "Berry purple"], ["navy", "Deep navy"], ["emerald", "Deep emerald"]];
/** Decoration drawn around the product, like the leaves and petals in beauty ads. */
export type ElementKind = "leaves" | "petals" | "drops" | "citrus" | "honey" | "sparkles" | "bubbles" | "swirls";
export const ELEMENT_LABELS: [ElementKind, string][] = [["leaves", "Herbal leaves"], ["petals", "Flowers & petals"], ["drops", "Oil / water drops"], ["citrus", "Citrus slices"], ["honey", "Honeycomb"], ["sparkles", "Sparkles"], ["bubbles", "Bubbles"], ["swirls", "Soft swirls"]];
/** Chooses elements from the product words / ingredients (pure, unit tested). Always returns something pretty. */
export function elementsFor(text: string): ElementKind[] {
  const t = String(text ?? "").toLowerCase(); const out = new Set<ElementKind>();
  if (/(aloe|neem|tulsi|basil|mint|herb|ayurved|green tea|tea tree|leaf|leaves|botanic|natural|amla|bhringraj|moringa|henna|sage)/.test(t)) out.add("leaves");
  if (/(rose|jasmine|lotus|hibiscus|saffron|kesar|flower|floral|marigold|chamomile|lavender|petal|orchid)/.test(t)) out.add("petals");
  if (/(oil|coconut|olive|argan|almond|castor|jojoba|serum|water|hydrat|hyaluronic|vitamin e|moistur|micellar|toner)/.test(t)) out.add("drops");
  if (/(lemon|orange|citrus|vitamin c|grapefruit|lime|mandarin|bergamot)/.test(t)) out.add("citrus");
  if (/(honey|turmeric|haldi|beeswax|propolis|gold)/.test(t)) { out.add("honey"); out.add("sparkles"); }
  if (/(foam|wash|cleans|shampoo|soap|bubble|scrub)/.test(t)) out.add("bubbles");
  if (!out.size) { out.add("leaves"); out.add("sparkles"); } else out.add("sparkles");
  return [...out].slice(0, 4);
}
export interface Options { template: Template; focusX: number; focusY: number; brand?: Brand; copy: Copy; mood?: Mood; elements?: ElementKind[] }

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


/** ---- decorative elements (vector shapes, drawn in the browser, no downloads) ---- */
const GREENS = ["#3E8E5A", "#2F7D4F", "#6BB070", "#8CC084"], PINKS = ["#F6A6C1", "#F48FB1", "#FBC4D4", "#F9D5E0"];
const leafShape = (c: Ctx, x: number, y: number, len: number, ang: number, fill: string, vein: string) => { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(len * 0.25, -len * 0.42, len * 0.8, -len * 0.34, len, 0); c.bezierCurveTo(len * 0.8, len * 0.34, len * 0.25, len * 0.42, 0, 0); c.fillStyle = fill; c.fill(); c.strokeStyle = vein; c.lineWidth = Math.max(1.5, len * 0.012); c.beginPath(); c.moveTo(len * 0.02, 0); c.lineTo(len * 0.92, 0); c.stroke(); c.restore(); };
const petalShape = (c: Ctx, x: number, y: number, len: number, ang: number, fill: string) => { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(len * 0.3, -len * 0.5, len * 0.95, -len * 0.35, len, 0); c.bezierCurveTo(len * 0.95, len * 0.35, len * 0.3, len * 0.5, 0, 0); c.fillStyle = fill; c.fill(); c.restore(); };
const flowerShape = (c: Ctx, x: number, y: number, len: number, rot: number, fill: string, center: string) => { for (let i = 0; i < 5; i++) petalShape(c, x, y, len, rot + i * (Math.PI * 2 / 5), fill); c.fillStyle = center; c.beginPath(); c.arc(x, y, len * 0.14, 0, 7); c.fill(); };
const dropShape = (c: Ctx, x: number, y: number, r: number, fill: string) => { c.save(); c.translate(x, y); c.beginPath(); c.moveTo(0, -r * 1.25); c.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.95, r * 0.95, 0, r * 0.95); c.bezierCurveTo(-r * 0.95, r * 0.95, -r * 0.9, -r * 0.2, 0, -r * 1.25); c.fillStyle = fill; c.fill(); c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.ellipse(-r * 0.32, r * 0.1, r * 0.14, r * 0.34, 0.2, 0, 7); c.fill(); c.restore(); };
const citrusShape = (c: Ctx, x: number, y: number, r: number, rind: string, flesh: string) => { c.save(); c.translate(x, y); c.fillStyle = rind; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.fillStyle = "#FFF4D6"; c.beginPath(); c.arc(0, 0, r * 0.88, 0, 7); c.fill(); c.fillStyle = flesh; c.beginPath(); c.arc(0, 0, r * 0.8, 0, 7); c.fill(); c.strokeStyle = "#FFF4D6"; c.lineWidth = Math.max(2, r * 0.06); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); c.stroke(); } c.restore(); };
const hexShape = (c: Ctx, x: number, y: number, r: number) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); };
const bubbleShape = (c: Ctx, x: number, y: number, r: number, a: number) => { const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, `rgba(255,255,255,${0.55 * a})`); g.addColorStop(1, `rgba(255,255,255,${0.05 * a})`); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = `rgba(255,255,255,${0.7 * a})`; c.lineWidth = Math.max(1.5, r * 0.06); c.stroke(); };
type Geo = { w: number; h: number; wide: boolean; card: { x: number; y: number; w: number; h: number }; S: number };
const deg = (d: number) => d * Math.PI / 180;
/** layer "back": behind the photo card (big, partly hidden). layer "front": small pieces overlapping the card edge. */
function drawElements(c: Ctx, kinds: ElementKind[], g: Geo, vivid: boolean, layer: "back" | "front") {
  const { w, h, wide, card } = g; const m = Math.min(card.w, card.h); const L = m * 0.6;
  const rx = wide ? w * 0.46 : w * 0.02, ry = wide ? h * 0.04 : h * 0.4, rw = wide ? w * 0.54 : w * 0.96, rh = wide ? h * 0.92 : h * 0.58; // free area for floating pieces (away from the words)
  const px = (i: number) => rx + rnd(i) * rw, py = (i: number) => ry + rnd(i + 31) * rh;
  const veil = (a: number) => (vivid ? `rgba(255,255,255,${a})` : ""); let seed = 0;
  for (const k of kinds) { seed += 100;
    if (k === "leaves") {
      if (layer === "back") {
        leafShape(c, w * 1.02, -h * 0.02, h * 0.95, deg(128), vivid ? veil(0.16) : "rgba(62,142,90,0.2)", vivid ? veil(0.2) : "rgba(47,125,79,0.25)"); leafShape(c, w * 0.5, h * 1.05, h * 0.8, deg(-62), vivid ? veil(0.12) : "rgba(107,176,112,0.2)", vivid ? veil(0.16) : "rgba(47,125,79,0.2)");
        [[-168, 0], [-138, 1], [-108, 2]].forEach(([a, i]) => leafShape(c, card.x + card.w * 0.12, card.y + card.h * 0.92, L * (0.8 + i * 0.12), deg(a), vivid ? veil(0.34 + i * 0.05) : GREENS[i], vivid ? veil(0.4) : "rgba(255,255,255,0.35)"));
        [[-12, 3], [-42, 0], [-72, 1]].forEach(([a, i]) => leafShape(c, card.x + card.w * 0.9, card.y + card.h * 0.1, L * (0.7 + (i % 2) * 0.12), deg(a), vivid ? veil(0.3) : GREENS[i], vivid ? veil(0.4) : "rgba(255,255,255,0.35)"));
      } else { [[-150, 0], [-120, 2]].forEach(([a, i]) => leafShape(c, card.x + card.w * 0.04, card.y + card.h * 0.97, L * 0.52, deg(a), vivid ? veil(0.5) : GREENS[i], "rgba(255,255,255,0.4)")); [[-30, 1], [-60, 3]].forEach(([a, i]) => leafShape(c, card.x + card.w * 0.98, card.y + card.h * 0.95, L * 0.42, deg(a + 90), vivid ? veil(0.45) : GREENS[i], "rgba(255,255,255,0.4)")); }
    } else if (k === "petals") {
      if (layer === "back") { for (let i = 0; i < 9; i++) petalShape(c, px(seed + i), py(seed + i), m * (0.09 + rnd(seed + i + 7) * 0.1), rnd(seed + i + 3) * 7, vivid ? veil(0.28 + rnd(i) * 0.2) : PINKS[i % 4]); flowerShape(c, card.x + card.w * 0.02, card.y + card.h * 0.12, m * 0.2, 0.4, vivid ? veil(0.4) : PINKS[1], "#F7C948"); }
      else { flowerShape(c, card.x + card.w * 0.98, card.y + card.h * 0.9, m * 0.15, 1, vivid ? veil(0.55) : PINKS[0], "#F7C948"); for (let i = 0; i < 3; i++) petalShape(c, card.x + card.w * (0.1 + i * 0.12), card.y + card.h * 1.0, m * 0.07, rnd(seed + i) * 6, vivid ? veil(0.5) : PINKS[(i + 1) % 4]); }
    } else if (k === "drops") {
      if (layer === "back") for (let i = 0; i < 6; i++) dropShape(c, px(seed + i), py(seed + i + 5), m * (0.035 + rnd(seed + i + 9) * 0.06), i % 2 ? "rgba(124,196,232,0.85)" : "rgba(242,184,75,0.9)");
      else { dropShape(c, card.x + card.w * 0.02, card.y + card.h * 0.82, m * 0.08, "rgba(242,184,75,0.95)"); dropShape(c, card.x + card.w * 0.97, card.y + card.h * 0.2, m * 0.06, "rgba(124,196,232,0.95)"); }
    } else if (k === "citrus") {
      if (layer === "back") citrusShape(c, card.x + card.w * 0.06, card.y + card.h * 0.1, m * 0.2, "#F39C32", "#FFB84D"); else citrusShape(c, card.x + card.w * 0.96, card.y + card.h * 0.93, m * 0.15, "#F7B733", "#FFD166");
    } else if (k === "honey") {
      if (layer === "back") { const r = m * 0.09; for (let i = 0; i < 7; i++) { const col = i % 3, row = Math.floor(i / 3); const hx = rx + rw * 0.78 + col * r * 1.75 + (row % 2) * r * 0.87, hy = ry + rh * 0.1 + row * r * 1.5; hexShape(c, hx, hy, r * 0.92); if (i % 3 === 1) { c.fillStyle = "rgba(242,184,75,0.85)"; c.fill(); } else { c.strokeStyle = vivid ? "rgba(255,255,255,0.45)" : "rgba(184,135,43,0.5)"; c.lineWidth = Math.max(2, r * 0.07); c.stroke(); } } }
    } else if (k === "sparkles") {
      for (let i = 0; i < (layer === "back" ? 8 : 4); i++) { const sx = layer === "back" ? px(seed + i) : card.x + card.w * (i % 2 ? 1.0 : 0.0) + (rnd(i + seed) - 0.5) * m * 0.1, sy = layer === "back" ? py(seed + i + 2) : card.y + card.h * (i < 2 ? 0.05 : 0.95); icon(c, "sparkle", sx, sy, m * (layer === "back" ? 0.02 + rnd(seed + i + 4) * 0.03 : 0.05), vivid ? "rgba(255,255,255,0.9)" : "rgba(212,160,40,0.95)"); }
    } else if (k === "bubbles") {
      for (let i = 0; i < (layer === "back" ? 10 : 3); i++) bubbleShape(c, layer === "back" ? px(seed + i) : card.x + card.w * (0.02 + i * 0.48), layer === "back" ? py(seed + i + 6) : card.y + card.h * (0.1 + i * 0.4), m * (layer === "back" ? 0.02 + rnd(seed + i + 3) * 0.06 : 0.04), vivid ? 1 : 1.4);
    } else if (k === "swirls" && layer === "back") {
      c.strokeStyle = vivid ? "rgba(255,255,255,0.3)" : "rgba(184,135,43,0.35)"; c.lineWidth = Math.max(2, m * 0.012); for (let i = 0; i < 3; i++) { c.beginPath(); const y0 = h * (0.25 + i * 0.25); c.moveTo(w * 0.35, y0); c.bezierCurveTo(w * 0.55, y0 - h * 0.3, w * 0.75, y0 + h * 0.3, w * 1.02, y0 - h * 0.1); c.stroke(); }
    }
  }
}

/** "Showcase": soft pastel background taken from the photo, the photo as a rounded card (never stretched or cut), headline, icon bullets, gold badge, button. */
function drawShowcase(c: Ctx, img: { width: number; height: number } & CanvasImageSource, w: number, h: number, o: Options, brand: Brand) {
  const V = o.mood ? VIVID[o.mood] : undefined; const wide = w / h >= 1.25; const S = wide ? Math.min(w * 0.6, h * 1.7) : w * 0.95; const pad = Math.round((wide ? h : w) * (wide ? 0.09 : 0.07)); const ink = V ? "#FFFFFF" : brand.primary;
  // 1. pastel background from the photo's own colours
  let r = 245, g = 238, b = 225;
  try { const t = document.createElement("canvas"); t.width = 16; t.height = 16; const tc = t.getContext("2d")!; tc.drawImage(img, 0, 0, 16, 16); const d = tc.getImageData(0, 0, 16, 16).data; let n = 0, rr = 0, gg = 0, bb = 0; for (let i = 0; i < d.length; i += 4) { rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; } r = rr / n; g = gg / n; b = bb / n; } catch { /* keep the cream */ }
  if (o.mood && o.mood !== "auto" && !V) [r, g, b] = MOOD_RGB[o.mood as keyof typeof MOOD_RGB];
  const strong = Boolean(o.mood && o.mood !== "auto"); const k1 = strong ? 0.66 : 0.82, k2 = strong ? 0.42 : 0.6; const mix = (v: number, k: number) => Math.round(v + (255 - v) * k); const p1 = `rgb(${mix(r, k1)},${mix(g, k1)},${mix(b, k1)})`, p2 = `rgb(${mix(r, k2)},${mix(g, k2)},${mix(b, k2)})`;
  const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, V ? V.c1 : p1); bg.addColorStop(1, V ? V.c2 : p2); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  if (!V) try { const bl = document.createElement("canvas"); bl.width = 24; bl.height = Math.max(8, Math.round(24 * h / w)); const bc = bl.getContext("2d")!; const cr = coverRect(img.width, img.height, bl.width, bl.height); bc.drawImage(img, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, bl.width, bl.height); c.save(); c.globalAlpha = 0.28; c.imageSmoothingEnabled = true; c.drawImage(bl, 0, 0, w, h); c.restore(); } catch { /* optional */ }
  // 2. decoration: soft bokeh circles + sparkles
  for (let i = 0; i < 14; i++) { const x = rnd(i + 1) * w, y = rnd(i + 50) * h, rad = (0.012 + rnd(i + 90) * 0.05) * Math.min(w, h * 1.6); const rg = c.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, "rgba(255,255,255,0.75)"); rg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = rg; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); }
  c.strokeStyle = hexA(brand.accent, 0.35); c.lineWidth = Math.max(2, S * 0.004); c.beginPath(); c.arc(wide ? w * 0.78 : w * 0.5, wide ? h * 0.5 : h * 0.72, Math.min(w, h) * 0.46, 0, 7); c.stroke();
  for (let i = 0; i < 5; i++) { const sx = wide ? w * (0.52 + rnd(i + 200) * 0.46) : w * (0.04 + rnd(i + 200) * 0.92), sy = wide ? h * (0.06 + rnd(i + 300) * 0.88) : h * (0.5 + rnd(i + 300) * 0.48); icon(c, "sparkle", sx, sy, Math.min(w, h) * (0.014 + rnd(i + 400) * 0.014), hexA(brand.accent, 0.8)); }
  // 3. regions
  const tb = wide ? { x: pad, y: pad * 0.7, w: w * 0.5 - pad, h: h - pad * 1.4 } : { x: pad, y: pad, w: w - pad * 2, h: h * 0.44 - pad };
  const pb = wide ? { x: w * 0.54, y: pad * 0.8, w: w * 0.46 - pad, h: h - pad * 1.6 } : { x: pad, y: h * 0.44, w: w - pad * 2, h: h * 0.56 - pad };
  // 4. photo card (fits, never stretched)
  const k = Math.min(pb.w / img.width, pb.h / img.height); const cw = img.width * k, ch = img.height * k; const cx = pb.x + (pb.w - cw) / 2, cy = pb.y + (pb.h - ch) / 2; const rad = Math.min(cw, ch) * 0.06;
  const geo: Geo = { w, h, wide, card: { x: cx, y: cy, w: cw, h: ch }, S }; const els = o.elements ?? []; if (els.length) drawElements(c, els, geo, Boolean(V), "back");
  c.save(); c.shadowColor = "rgba(20,30,20,0.28)"; c.shadowBlur = S * 0.05; c.shadowOffsetY = S * 0.02; c.fillStyle = "#fff"; pill(c, cx, cy, cw, ch, rad); c.fill(); c.restore();
  c.save(); pill(c, cx, cy, cw, ch, rad); c.clip(); c.drawImage(img, cx, cy, cw, ch); c.restore();
  c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = Math.max(3, S * 0.006); pill(c, cx, cy, cw, ch, rad); c.stroke();
  if (els.length) drawElements(c, els, geo, Boolean(V), "front");
  // 5. text
  const { headline, sub, cta, bullets, badge } = o.copy; const bl = (bullets ?? []).map(x => x.trim()).filter(Boolean).slice(0, 3);
  let tg = 0, hs = 0, ss = 0, bs = 0, cs = 0, hl: string[] = [], sl: string[] = [], bLines: string[][] = [], ic = 0, ctaH = 0, bH = 0, total = 0, colW = tb.w / Math.max(1, bl.length);
  c.textAlign = "left"; c.textBaseline = "alphabetic";
  for (let f = 1; f >= 0.4; f -= 0.06) { // shrink everything a little until it fits the space
    hs = Math.round((wide ? S * 0.105 : S * 0.085) * f); ss = Math.round(hs * 0.38); bs = Math.round(hs * 0.3); cs = Math.round(hs * 0.3);
    c.font = `600 ${hs}px ${brand.display}`; hl = headline.trim() ? wrapText(headline.trim(), tb.w, s => c.measureText(s).width, wide ? 3 : 2) : [];
    c.font = `400 ${ss}px ${brand.sans}`; sl = sub.trim() ? wrapText(sub.trim(), tb.w, s => c.measureText(s).width, 2) : [];
    ic = bs * 2.1; bLines = bl.map(t => { c.font = `500 ${bs}px ${brand.sans}`; return wrapText(t, colW - ic - bs * 0.6, s => c.measureText(s).width, 2); });
    tg = (o.copy.tag ?? "").trim() ? Math.round(ss * 2.1) : 0; ctaH = cta.trim() ? cs * 2.4 : 0; bH = bl.length ? Math.max(ic, ...bLines.map(x => x.length * bs * 1.25)) : 0;
    total = (tg ? tg + hs * 0.2 : 0) + hs * 0.9 + hl.length * hs * 1.08 + (sl.length ? ss * 0.1 + sl.length * ss * 1.4 : 0) + (bH ? hs * 0.15 + bH + hs * 0.2 : 0) + (ctaH ? hs * 0.2 + ctaH : 0);
    if (total <= tb.h) break;
  }
  let y0 = wide ? tb.y + Math.max(0, (tb.h - total) / 2) : tb.y; const tagT = (o.copy.tag ?? "").trim().slice(0, 32);
  if (tagT && tg) { c.font = `500 ${Math.round(ss * 0.9)}px ${brand.sans}`; const tw0 = c.measureText(tagT).width + tg * 1.1; c.fillStyle = V ? "rgba(255,255,255,0.22)" : hexA(brand.accent, 0.2); pill(c, tb.x, y0, tw0, tg, tg / 2); c.fill(); c.fillStyle = ink; c.textAlign = "left"; c.fillText(tagT, tb.x + tg * 0.55, y0 + tg * 0.66); y0 += tg + hs * 0.2; }
  let y = y0 + hs * 0.9;
  c.fillStyle = ink; c.font = `600 ${hs}px ${brand.display}`; for (const l of hl) { c.fillText(l, tb.x, y); y += hs * 1.08; }
  if (sl.length) { y += ss * 0.1; c.font = `400 ${ss}px ${brand.sans}`; c.globalAlpha = 0.85; for (const l of sl) { c.fillText(l, tb.x, y); y += ss * 1.4; } c.globalAlpha = 1; }
  if (bH) { y += hs * 0.15; bl.forEach((_, i) => { const bx = tb.x + i * colW; c.fillStyle = V ? "rgba(255,255,255,0.22)" : hexA(brand.accent, 0.18); c.beginPath(); c.arc(bx + ic / 2, y + ic / 2, ic / 2, 0, 7); c.fill(); icon(c, iconFor(bl[i]), bx + ic / 2, y + ic / 2, ic * 0.38, ink); c.fillStyle = ink; c.font = `500 ${bs}px ${brand.sans}`; bLines[i].forEach((l, j) => c.fillText(l, bx + ic + bs * 0.5, y + (ic - bLines[i].length * bs * 1.25) / 2 + bs * 1.0 + j * bs * 1.25)); }); y += bH + hs * 0.2; }
  if (ctaH) { y += hs * 0.2; c.font = `600 ${cs}px ${brand.sans}`; const label = cta.trim().toUpperCase(); const tw = c.measureText(label).width + cs * 3; c.save(); c.shadowColor = hexA(brand.accent, 0.4); c.shadowBlur = cs * 0.8; c.shadowOffsetY = cs * 0.25; c.fillStyle = V ? "#fff" : brand.accent; pill(c, tb.x, y, tw, ctaH, ctaH / 2); c.fill(); c.restore(); c.fillStyle = V ? V.c2 : "#fff"; c.textAlign = "center"; c.fillText(label, tb.x + tw / 2, y + ctaH / 2 + cs * 0.35); c.textAlign = "left"; }
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

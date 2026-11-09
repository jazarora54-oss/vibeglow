import { brandFromTheme, drawCreative, type Mood } from "@/lib/creative/render";
import type { AiDraft } from "@/lib/ai/draft";
/** Browser helpers shared by the bulk lister: shrink a photo to WebP, hash it for duplicate checks, base64 it, and make the 2 designed extra pictures (free, not AI art). */
export async function toWebp(file: Blob, max: number, q: number): Promise<Blob> {
  const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("Could not convert the photo."))), "image/webp", q));
}
export async function dHash(file: Blob): Promise<string> {
  const bmp = await createImageBitmap(file); const c = document.createElement("canvas"); c.width = 9; c.height = 8; const x = c.getContext("2d")!; x.drawImage(bmp, 0, 0, 9, 8); bmp.close();
  const px = x.getImageData(0, 0, 9, 8).data; const g = (i: number, j: number) => { const o = (j * 9 + i) * 4; return px[o] * 0.299 + px[o + 1] * 0.587 + px[o + 2] * 0.114; };
  let bits = ""; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) bits += g(i, j) > g(i + 1, j) ? "1" : "0";
  let hex = ""; for (let k = 0; k < 64; k += 4) hex += parseInt(bits.slice(k, k + 4), 2).toString(16); return hex;
}
export const b64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = () => rej(new Error("read")); r.readAsDataURL(b); });
export async function makeGraphics(file: Blob, d: AiDraft): Promise<Blob[]> {
  const bmp = await createImageBitmap(file); const out: Blob[] = [];
  const bl = d.benefits.split(/\n|;|,|•/).map(x => x.trim()).filter(x => x && x.length <= 24).slice(0, 3); const badge = /^[\w.]+\s?(g|ml|oz|fl oz|kg|l)$/i.test(d.size_quantity.trim()) ? d.size_quantity.trim().slice(0, 12) : "";
  for (const [w, h, mood] of [[1080, 1080, "auto"], [1080, 1350, "warm"]] as [number, number, Mood][]) { const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    drawCreative(cv.getContext("2d")!, bmp, w, h, { template: "showcase", focusX: 0.5, focusY: 0.5, mood, brand: brandFromTheme(), copy: { headline: d.name, sub: d.short_description.slice(0, 80), cta: "", bullets: bl, badge } });
    out.push(await new Promise<Blob>((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error("Could not make the extra picture."))), "image/webp", 0.85))); }
  bmp.close(); return out;
}

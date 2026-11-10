/** Fits any picture to an exact banner size in the browser, BEFORE it is uploaded.
 *  auto  = shape is close to the banner shape -> fill the whole banner (a tiny edge trim). Otherwise show the WHOLE picture in the
 *          middle on a soft blurred copy of itself, so nothing is cut off.
 *  fill  = always fill the banner (edges may be trimmed).
 *  whole = always show the whole picture on the blurred background.
 *  Browser only (canvas). GIF / video are never passed through here because re-drawing would remove the animation. */
export type FitMode = "auto" | "fill" | "whole";
export interface FitResult { blob: Blob; name: string; how: "exact" | "fill" | "whole" | "unchanged"; srcW: number; srcH: number; note: string }
/** Pictures whose shape differs from the banner by less than this (as a ratio, 0.12 = 12%) are simply filled. */
export const CLOSE_ENOUGH = 0.12;
export const shapeDiff = (w: number, h: number, tw: number, th: number) => Math.abs(Math.log(w / h / (tw / th)));
export const isCloseShape = (w: number, h: number, tw: number, th: number) => shapeDiff(w, h, tw, th) <= Math.log(1 + CLOSE_ENOUGH);

const toBlob = (cv: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>(res => cv.toBlob(res, type, q));
const baseName = (n: string) => n.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) || "banner";

/** A soft, blurred copy of the picture that covers the whole canvas. Works in every browser (no ctx.filter needed):
 *  draw the picture very small, then scale it up with smoothing. */
function blurredBackdrop(ctx: CanvasRenderingContext2D, bmp: ImageBitmap, W: number, H: number) {
  const k = 40 / Math.max(W, H); const sw = Math.max(8, Math.round(W * k)), sh = Math.max(8, Math.round(H * k));
  const tiny = document.createElement("canvas"); tiny.width = sw; tiny.height = sh; const t = tiny.getContext("2d")!;
  t.imageSmoothingQuality = "high"; const s = Math.max(sw / bmp.width, sh / bmp.height); t.drawImage(bmp, (sw - bmp.width * s) / 2, (sh - bmp.height * s) / 2, bmp.width * s, bmp.height * s);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(tiny, 0, 0, sw, sh, 0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.10)"; ctx.fillRect(0, 0, W, H); // slightly calmer so the real picture stands out
}

export async function fitImage(file: File, W: number, H: number, mode: FitMode = "auto", type: "image/jpeg" | "image/webp" = "image/jpeg"): Promise<FitResult> {
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file); } catch { return { blob: file, name: file.name, how: "unchanged", srcW: 0, srcH: 0, note: "Could not read the picture to resize it, so it was uploaded as it is." }; }
  const bw = bmp.width, bh = bmp.height;
  const okType = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
  if (bw === W && bh === H && okType) { bmp.close(); return { blob: file, name: file.name, how: "exact", srcW: bw, srcH: bh, note: `Picture is already exactly ${W} × ${H}.` }; }
  const close = isCloseShape(bw, bh, W, H);
  const how: "fill" | "whole" = mode === "fill" ? "fill" : mode === "whole" ? "whole" : close ? "fill" : "whole";
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  if (how === "fill") { const s = Math.max(W / bw, H / bh); ctx.drawImage(bmp, (W - bw * s) / 2, (H - bh * s) / 2, bw * s, bh * s); }
  else {
    blurredBackdrop(ctx, bmp, W, H); const s = Math.min(W / bw, H / bh); const dw = bw * s, dh = bh * s, dx = (W - dw) / 2, dy = (H - dh) / 2;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.28)"; ctx.shadowBlur = Math.round(Math.min(W, H) * 0.03); ctx.fillStyle = "#000"; ctx.fillRect(dx, dy, dw, dh); ctx.restore(); // soft edge so the picture lifts off the backdrop
    ctx.drawImage(bmp, dx, dy, dw, dh);
  }
  bmp.close();
  let out = await toBlob(cv, type, 0.9); let ext = type === "image/webp" ? "webp" : "jpg";
  if (!out || out.type !== type) { out = await toBlob(cv, "image/jpeg", 0.9); ext = "jpg"; } // some browsers (Safari) cannot write WebP
  if (!out) return { blob: file, name: file.name, how: "unchanged", srcW: bw, srcH: bh, note: "Could not resize the picture, so it was uploaded as it is." };
  return { blob: out, name: `${baseName(file.name)}.${ext}`, how, srcW: bw, srcH: bh,
    note: how === "fill" ? `Resized to ${W} × ${H}: the picture fills the whole banner${close ? "" : " (edges trimmed)"}.` : `Resized to ${W} × ${H}: the whole picture is shown, with a soft blurred background on the sides.` };
}

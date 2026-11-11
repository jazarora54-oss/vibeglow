/** Browser only: fits ANY picture to an exact banner size so nothing looks cut or stretched.
 *  "auto": nearly the right shape -> filled edge to edge; a different shape -> the WHOLE picture is shown, centred, on a soft blurred copy of itself.
 *  "fill": always edge to edge (the edges may be trimmed). "whole": always the whole picture on the blurred backdrop. */
export type Fit = "auto" | "fill" | "whole";
export const FIT_LABELS: [Fit, string][] = [["auto", "Automatic (recommended)"], ["fill", "Fill the banner (edges may be trimmed)"], ["whole", "Show the whole picture (soft blurred sides)"]];
export async function fitToBanner(file: Blob, w: number, h: number, mode: Fit = "auto", maxKB = 450): Promise<{ blob: Blob; how: string; srcW: number; srcH: number }> {
  const bmp = await createImageBitmap(file); const bw = bmp.width, bh = bmp.height; const close = Math.abs(bw / bh / (w / h) - 1) <= 0.08; const whole = mode === "whole" || (mode === "auto" && !close);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const x = cv.getContext("2d")!; x.imageSmoothingQuality = "high";
  const cover = (ctx: CanvasRenderingContext2D, cw: number, ch: number) => { const k = Math.max(cw / bw, ch / bh); const dw = bw * k, dh = bh * k; ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh); };
  let how: string;
  if (!whole) { cover(x, w, h); how = close ? "it fits this banner shape" : "filled edge to edge, the edges were trimmed a little"; }
  else {
    // blurred backdrop without ctx.filter (works in every browser): shrink a covered copy, then stretch it back up smoothly
    const sm = document.createElement("canvas"); sm.width = 40; sm.height = Math.max(8, Math.round(40 * h / w)); const sx = sm.getContext("2d")!; sx.imageSmoothingQuality = "high"; cover(sx, sm.width, sm.height);
    x.drawImage(sm, 0, 0, w, h); x.fillStyle = "rgba(255,255,255,0.10)"; x.fillRect(0, 0, w, h);
    const k = Math.min(w / bw, h / bh); const dw = bw * k, dh = bh * k; x.save(); x.shadowColor = "rgba(0,0,0,0.22)"; x.shadowBlur = Math.round(Math.min(w, h) * 0.04); x.drawImage(bmp, (w - dw) / 2, (h - dh) / 2, dw, dh); x.restore();
    how = "the whole picture is shown with soft blurred sides";
  }
  bmp.close(); let q = 0.88;
  for (;;) { const b: Blob | null = await new Promise(res => cv.toBlob(res, "image/webp", q)); if (!b) throw new Error("Could not prepare the picture in this browser."); if (b.size <= maxKB * 1024 || q <= 0.5) return { blob: b, how, srcW: bw, srcH: bh }; q -= 0.08; }
}

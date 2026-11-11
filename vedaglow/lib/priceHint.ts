/** Price + title hints from prices the owner types in (from Google Shopping, Amazon, eBay…). No website is contacted by the shop. */
export interface MarketHint { count: number; low: number; median: number; high: number; avg: number; gapToMedianPct: number | null; level: "none" | "cheap" | "fair" | "high" | "very-high"; message: string }
const r2 = (n: number) => Math.round(n * 100) / 100;
export function marketHint(yourPrice: number, others: number[]): MarketHint {
  const v = others.filter(n => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!v.length) return { count: 0, low: 0, median: 0, high: 0, avg: 0, gapToMedianPct: null, level: "none", message: "Type 2-3 prices you see online (same product, same size) to get a hint." };
  const median = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; const avg = v.reduce((s, n) => s + n, 0) / v.length;
  const base = { count: v.length, low: r2(v[0]), median: r2(median), high: r2(v[v.length - 1]), avg: r2(avg) };
  if (!(yourPrice > 0)) return { ...base, gapToMedianPct: null, level: "none", message: "Enter your price to compare." };
  const gap = Math.round(((yourPrice - median) / median) * 1000) / 10;
  const few = v.length < 3 ? " (only " + v.length + " price" + (v.length > 1 ? "s" : "") + " – add more for a better hint)" : "";
  if (gap <= -25) return { ...base, gapToMedianPct: gap, level: "cheap", message: `Your price is ${Math.abs(gap)}% BELOW the online middle price ($${r2(median)}). You may be selling too cheap – check you still make profit and keep room for sales.${few}` };
  if (gap <= 10) return { ...base, gapToMedianPct: gap, level: "fair", message: `Your price is in line with the online market (middle price $${r2(median)}, range $${r2(v[0])}–$${r2(v[v.length - 1])}).${few}` };
  if (gap <= 30) return { ...base, gapToMedianPct: gap, level: "high", message: `Your price is ${gap}% ABOVE the online middle price ($${r2(median)}). Cheapest seen: $${r2(v[0])}. Customers may compare – a lower price or a strong reason (quality, size) helps.${few}` };
  return { ...base, gapToMedianPct: gap, level: "very-high", message: `Your price is ${gap}% ABOVE the online middle price ($${r2(median)}) and the cheapest is $${r2(v[0])}. Online it is selling for much less – expect fewer sales unless this is a different size/quality.${few}` };
}
/** Simple local title checks (no internet). */
export function titleTips(name: string, brand?: string, size?: string): string[] {
  const t = (name ?? "").trim(), tips: string[] = [];
  if (t.length < 20) tips.push("Title is short – add the product type and size (e.g. “Kumkumadi Face Oil 30 ml”).");
  if (t.length > 80) tips.push("Title is long – Google and marketplaces cut it after about 60-80 characters.");
  if (brand && !t.toLowerCase().includes(brand.toLowerCase())) tips.push(`Brand “${brand}” is not in the title.`);
  if (!/\b\d+(\.\d+)?\s?(ml|l|g|kg|oz|fl\.? ?oz|lb|pcs?|pack|count|ct)\b/i.test(t) && !size) tips.push("No size/quantity in the title or size field – buyers search by size.");
  if (/[A-Z]{6,}/.test(t)) tips.push("Avoid ALL CAPS words in the title.");
  if (/[!$*]{2,}|\b(best|cheap|sale|free)\b/i.test(t)) tips.push("Avoid words like “best”, “cheap”, “sale”, “free” or !!! in the title.");
  return tips;
}
export const searchLinks = (q: string) => { const e = encodeURIComponent(q.trim().slice(0, 120)); return [["Google Shopping", `https://www.google.com/search?tbm=shop&q=${e}`], ["Amazon", `https://www.amazon.com/s?k=${e}`], ["eBay (sold items)", `https://www.ebay.com/sch/i.html?_nkw=${e}&LH_Sold=1&LH_Complete=1`], ["Walmart", `https://www.walmart.com/search?q=${e}`]] as [string, string][]; };

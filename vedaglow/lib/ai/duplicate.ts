/** Duplicate checks for new products: same/similar name, or the same photo (64-bit "difference hash" made in the browser). */
const STOP = new Set(["the", "a", "an", "and", "of", "for", "with", "by", "oil", "ml", "oz", "gm", "g", "pack", "new"]);
export const normName = (s: string) => String(s ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s: string) => new Set(normName(s).split(" ").filter(t => t.length > 1 && !STOP.has(t) && !/^\d+(ml|oz|gm|g|l|lb)?$/.test(t)));
/** 0..1 word overlap (Jaccard). 1 = same words. */
export function nameSimilarity(a: string, b: string): number {
  const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let i = 0; for (const t of A) if (B.has(t)) i++; return i / (A.size + B.size - i);
}
/** Number of different bits between two 16-hex-digit fingerprints (null if either is malformed). */
export function hamming(a: string, b: string): number | null {
  if (!/^[0-9a-f]{16}$/.test(a) || !/^[0-9a-f]{16}$/.test(b)) return null; let d = 0;
  for (let i = 0; i < 16; i++) { let x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x) { d += x & 1; x >>= 1; } } return d;
}
export interface DupHit { id: string; name: string; why: "same name" | "similar name" | "same photo" }
export function findDuplicates(name: string, hash: string | undefined, products: { id: string; name: string; sku?: string | null }[], hashes: { product_id: string | null; image_hash: string | null }[]): DupHit[] {
  const out = new Map<string, DupHit>(); const n = normName(name);
  for (const p of products) { if (!n) break; const s = nameSimilarity(name, p.name); if (normName(p.name) === n) out.set(p.id, { id: p.id, name: p.name, why: "same name" }); else if (s >= 0.7) out.set(p.id, { id: p.id, name: p.name, why: "similar name" }); }
  if (hash) for (const h of hashes) { if (!h.product_id || !h.image_hash) continue; const d = hamming(hash, h.image_hash); if (d !== null && d <= 6) { const p = products.find(x => x.id === h.product_id); if (p) out.set(p.id, { id: p.id, name: p.name, why: "same photo" }); } }
  return [...out.values()].slice(0, 5);
}

import type { Product } from "@/types";
import { discountPct } from "@/lib/format";
export default function ProductBadges({ product }: { product: Product }) {
  const pct = discountPct(product); const t = product.tags;
  const b = [t.includes("new") && ["NEW", "bg-forest text-white"], (t.includes("sale") || pct > 0) && ["SALE", "bg-red-700 text-white"], t.includes("best-seller") && ["BEST SELLER", "bg-gold text-white"], t.includes("featured") && ["FEATURED", "bg-cream-dark text-forest"]].filter(Boolean) as string[][];
  return <div className="flex flex-wrap gap-1.5">{b.map(([l, c]) => <span key={l} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide ${c}`}>{l}</span>)}</div>;
}

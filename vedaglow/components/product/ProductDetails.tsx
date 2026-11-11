"use client";
import { useSelection } from "./ProductSelection";
export default function ProductDetails() {
  const { product: p, variant: v, sku, stock } = useSelection();
  const rows: [string, string | undefined][] = [["Brand", p.brand], ["Product Type", p.product_type], ["SKU", sku], ["Size", v?.size ?? p.size], ["Color", v?.color], ["Suitable For", p.suitable_for],
    ["Availability", stock <= 0 ? "Out of Stock" : stock <= 5 ? `Only ${stock} left in stock` : "In Stock"]];
  const more: [string, string | undefined][] = [["Condition", p.condition], ["Country of Origin", p.country_of_origin], ["Expiration Date", p.shelf_life], ["MPN", p.mpn], ["UPC / GTIN", p.gtin], ["Weight", p.weight_g ? `${p.weight_g} g` : undefined], ...(p.specifics ?? []).map(x => [x.name, x.value] as [string, string])];
  const have = new Set(rows.filter(([, val]) => val).map(([k]) => k.toLowerCase())); // no repeats (Brand, Size, Suitable For ...)
  const shown = [...rows.filter(([, val]) => val), ...more.filter(([k, val]) => val && !have.has(String(k).toLowerCase()) && !have.add(String(k).toLowerCase()))];
  return (
    <section aria-labelledby="pd" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <h2 id="pd" className="font-display text-3xl font-semibold text-forest">Item specifics</h2>
      <dl className="mt-4 grid gap-x-10 gap-y-2 rounded-3xl border border-forest/10 bg-white p-6 shadow-card sm:grid-cols-2">
        {shown.map(([k, val]) => <div key={k} className="flex gap-2 border-b border-forest/5 py-1.5 text-sm"><dt className="w-32 shrink-0 text-ink/60">{k}</dt><dd className="min-w-0 font-medium">{val}</dd></div>)}
      </dl>
    </section>
  );
}

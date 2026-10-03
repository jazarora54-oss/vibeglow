"use client";
import { useEffect, useState } from "react";
import { CATEGORY_OPTIONS, activeFilterCount, type ShopLock, type ShopQuery } from "@/lib/shop";
interface Props { query: ShopQuery; onChange: (p: Partial<ShopQuery>) => void; onClear: () => void; lock?: ShopLock }
const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <fieldset className="border-b border-forest/10 py-5 first:pt-0"><legend className="mb-3 font-display text-lg font-semibold text-forest">{title}</legend><div className="space-y-2.5">{children}</div></fieldset>);
const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-forest/40 accent-forest" />{label}</label>);
const MAX = 30;
export default function ProductFilters({ query: q, onChange, onClear, lock }: Props) {
  const [min, setMin] = useState(q.min?.toString() ?? ""); const [max, setMax] = useState(q.max?.toString() ?? "");
  useEffect(() => { setMin(q.min?.toString() ?? ""); setMax(q.max?.toString() ?? ""); }, [q.min, q.max]);
  const applyPrice = () => { const a = parseFloat(min), b = parseFloat(max); onChange({ min: isNaN(a) ? undefined : a, max: isNaN(b) ? undefined : b }); };
  const toggleCat = (slug: string, on: boolean) => onChange({ category: on ? [...q.category, slug] : q.category.filter(c => c !== slug) });
  const field = "w-full rounded-md border border-forest/20 bg-white px-3 py-2 text-sm";
  return (
    <div>
      {!lock?.category && <Group title="Category">{CATEGORY_OPTIONS.map(c => <Check key={c.slug} label={c.name} checked={q.category.includes(c.slug)} onChange={v => toggleCat(c.slug, v)} />)}</Group>}
      <Group title="Price">
        <div className="flex items-center gap-2">
          <label className="flex-1"><span className="sr-only">Minimum price</span><input inputMode="decimal" placeholder="Min $" value={min} onChange={e => setMin(e.target.value)} onBlur={applyPrice} onKeyDown={e => e.key === "Enter" && applyPrice()} className={field} /></label>
          <span className="text-ink/40">–</span>
          <label className="flex-1"><span className="sr-only">Maximum price</span><input inputMode="decimal" placeholder="Max $" value={max} onChange={e => setMax(e.target.value)} onBlur={applyPrice} onKeyDown={e => e.key === "Enter" && applyPrice()} className={field} /></label>
        </div>
        <input type="range" min={0} max={MAX} step={1} value={q.max ?? MAX} aria-label="Maximum price" onChange={e => onChange({ max: +e.target.value >= MAX ? undefined : +e.target.value })} className="w-full accent-forest" />
        <p className="text-xs text-ink/60">Up to {q.max !== undefined ? `$${q.max}` : `$${MAX}+`}</p>
      </Group>
      <Group title="Availability">
        <Check label="In Stock" checked={q.inStock} onChange={v => onChange({ inStock: v })} />
        <Check label="Out of Stock" checked={q.outOfStock} onChange={v => onChange({ outOfStock: v })} />
      </Group>
      <Group title="Special">
        {lock?.special !== "new" && <Check label="New Arrivals" checked={q.isNew} onChange={v => onChange({ isNew: v })} />}
        <Check label="Best Sellers" checked={q.bestSeller} onChange={v => onChange({ bestSeller: v })} />
        {lock?.special !== "sale" && <Check label="On Sale" checked={q.onSale} onChange={v => onChange({ onSale: v })} />}
        <Check label="Featured" checked={q.featured} onChange={v => onChange({ featured: v })} />
      </Group>
      <button onClick={onClear} disabled={!activeFilterCount(q)} className="mt-5 w-full rounded-md border border-forest py-2.5 text-sm font-semibold text-forest hover:bg-forest hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-forest">Clear All Filters</button>
    </div>
  );
}

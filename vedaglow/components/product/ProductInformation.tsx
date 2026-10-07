"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { Product } from "@/types";
import { weightText } from "@/lib/shipping/rules";
type Rows = [string, string][];
const specRows = (p: Product): Rows => ([["Brand", p.brand], ["Condition", p.condition], ["Type", p.product_type], ["Size", p.size], ["Suitable for", p.suitable_for], ["Country of origin", p.country_of_origin], ["Shelf life", p.shelf_life],
  ["Weight", weightText(p.weight_g) || undefined], ["Dimensions", p.dimensions], ["Shipping", p.shipping_mode === "free" ? "Free shipping" : undefined], ["SKU", p.sku], ["GTIN / UPC", p.gtin], ["MPN", p.mpn], ...(p.specifics ?? []).map(x => [x.name, x.value] as [string, string | undefined])] as [string, string | undefined][]).filter(r => r[1]) as Rows;
const body = (t: string | Rows): ReactNode => typeof t === "string" ? t : <dl className="grid max-w-2xl grid-cols-[minmax(7rem,1fr)_2fr] gap-x-6 gap-y-2 text-base">{t.map(([k, v]) => <div key={k} className="contents"><dt className="font-semibold text-forest">{k}</dt><dd className="text-ink/80">{v}</dd></div>)}</dl>;
/** Desktop: tabs. Mobile: accordion. A section only renders when its data exists. */
export default function ProductInformation({ product: p }: { product: Product }) {
  const sections = ([["description", "Description", p.description], ["ingredients", "Ingredients", p.ingredients], ["benefits", "Benefits", p.benefits], ["how-to-use", "How to Use", p.how_to_use],
    ["size", "Size & Quantity", p.size_quantity], ["shipping", "Shipping", p.shipping_info], ["returns", "Returns", p.return_info]] as [string, string, string | undefined][]).filter(s => s[2]) as [string, string, string | Rows][];
  const specs = specRows(p); if (specs.length) sections.push(["specs", "Specifications", specs]);
  const [active, setActive] = useState(sections[0]?.[0]); const [open, setOpen] = useState<string[]>(sections.slice(0, 1).map(s => s[0]));
  if (!sections.length) return null;
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; e.preventDefault();
    const n = sections[(i + d + sections.length) % sections.length][0]; setActive(n); document.getElementById(`tab-${n}`)?.focus();
  };
  return (
    <section aria-label="Product information" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="hidden md:block">
        <div role="tablist" aria-label="Product information" className="flex gap-8 border-b border-forest/15">
          {sections.map(([id, label], i) => <button type="button" key={id} id={`tab-${id}`} role="tab" aria-selected={active === id} aria-controls={`panel-${id}`} tabIndex={active === id ? 0 : -1} onClick={() => setActive(id)} onKeyDown={e => onKey(e, i)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold tracking-wide ${active === id ? "border-gold text-forest" : "border-transparent text-ink/60 hover:text-forest"}`}>{label.toUpperCase()}</button>)}
        </div>
        {sections.map(([id, label, text]) => <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden={active !== id} className="fade-in max-w-3xl py-6 text-lg leading-relaxed text-ink/80">{body(text)}</div>)}
      </div>
      <div className="divide-y divide-forest/10 rounded-2xl bg-white shadow-card md:hidden">
        {sections.map(([id, label, text]) => { const on = open.includes(id); return (
          <div key={id}><h3><button type="button" aria-expanded={on} aria-controls={`acc-${id}`} onClick={() => setOpen(o => on ? o.filter(x => x !== id) : [...o, id])} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold tracking-wide text-forest">{label.toUpperCase()}<ChevronDown size={18} className={`transition-transform ${on ? "rotate-180" : ""}`} /></button></h3>
            <div id={`acc-${id}`} hidden={!on} className="px-5 pb-5 leading-relaxed text-ink/80">{body(text)}</div></div>); })}
      </div>
    </section>
  );
}

"use client";
import { useMemo, useState } from "react";
import { marketHint, searchLinks, titleTips } from "@/lib/priceHint";
import { card, inp, lbl } from "./ui";
const TONE: Record<string, string> = { none: "bg-cream text-ink/70", cheap: "bg-amber-50 text-amber-900", fair: "bg-green-50 text-green-900", high: "bg-amber-50 text-amber-900", "very-high": "bg-red-50 text-red-800" };
/** Helps price a product: opens online searches with your title and compares the prices you type in. Nothing is saved or sent anywhere. */
export default function PriceCheck({ name, brand, size, price }: { name: string; brand?: string; size?: string; price: number }) {
  const [vals, setVals] = useState<string[]>(["", "", ""]);
  const nums = vals.map(v => Number(v.replace(/[^0-9.]/g, ""))).filter(n => n > 0);
  const hint = useMemo(() => marketHint(Number(price), nums), [price, vals]); // eslint-disable-line react-hooks/exhaustive-deps
  const tips = titleTips(name, brand, size); const q = [brand, name].filter(Boolean).join(" ").trim();
  return (<section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Online price &amp; title check</h2>
    <p className="mb-3 text-sm text-ink/60">Optional helper. Search the same product online, type the prices you see, and get a hint. (The shop does not read other websites by itself.)</p>
    <div className="mb-4 flex flex-wrap gap-2">{q ? searchLinks(q).map(([l, u]) => <a key={l} href={u} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-forest/25 bg-white px-3 py-1.5 text-sm font-semibold text-forest hover:bg-forest-100">Search {l} ↗</a>) : <span className="text-sm text-ink/50">Type the product title first, then search links appear.</span>}</div>
    <div className="grid gap-3 sm:grid-cols-5">{vals.map((v, i) => <div key={i}><label className={lbl} htmlFor={`mp${i}`}>Online price {i + 1} ($)</label><input id={`mp${i}`} inputMode="decimal" className={inp} value={v} onChange={e => setVals(a => a.map((x, k) => (k === i ? e.target.value : x)))} placeholder="e.g. 19.99" /></div>)}
      {vals.length < 5 && <button type="button" className="self-end text-sm font-semibold text-forest underline" onClick={() => setVals(a => [...a, ""])}>+ add price</button>}</div>
    <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${TONE[hint.level]}`}>{hint.message}{hint.count > 0 && <span className="mt-1 block text-xs opacity-80">Lowest ${hint.low} · Middle ${hint.median} · Average ${hint.avg} · Highest ${hint.high}</span>}</p>
    {tips.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-ink/70">{tips.map(t => <li key={t}>{t}</li>)}</ul>}</section>);
}

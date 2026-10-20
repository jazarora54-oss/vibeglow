"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDeal, saveDeal, setDealActive, type DealInput } from "@/app/admin/actions";
import { dealTitle } from "@/lib/cart/deals";
import { btn, btn2, btnDanger, card, inp, lbl } from "./ui";
export interface DealRow { id: string; name: string; kind: "buy_get" | "percent"; buy_qty: number; get_qty: number; percent_off: number; product_ids: string[]; starts_at: string | null; ends_at: string | null; is_active: boolean }
const PRESETS: { label: string; hint: string; make: () => DealInput }[] = [
  { label: "Buy 2 Get 1 Free", hint: "Cheapest of every 3 is free", make: () => ({ name: "Buy 2 Get 1 Free", kind: "buy_get", buy_qty: 2, get_qty: 1, percent_off: 100, product_ids: [], is_active: true }) },
  { label: "Buy 1 Get 1 Half Price", hint: "Every 2nd item is 50% off", make: () => ({ name: "Buy 1 Get 1 Half Price", kind: "buy_get", buy_qty: 1, get_qty: 1, percent_off: 50, product_ids: [], is_active: true }) },
  { label: "% Off Sale", hint: "Percent off the selected products", make: () => ({ name: "Sale", kind: "percent", buy_qty: 1, get_qty: 1, percent_off: 20, product_ids: [], is_active: true }) },
];
// Dates are shown as plain days in Pacific time (the same way they were entered).
const day = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }) : undefined;
const statusOf = (d: DealRow) => { if (!d.is_active) return { t: "Off", c: "bg-gray-200 text-gray-700" }; const now = Date.now(); if (d.starts_at && Date.parse(d.starts_at) > now) return { t: "Scheduled", c: "bg-blue-100 text-blue-800" }; if (d.ends_at && Date.parse(d.ends_at) < now) return { t: "Ended", c: "bg-amber-100 text-amber-800" }; return { t: "Live", c: "bg-green-100 text-green-800" }; };
export default function DealManager({ deals, products, dbError }: { deals: DealRow[]; products: { id: string; name: string }[]; dbError?: string }) {
  const [edit, setEdit] = useState<DealInput | null>(null); const [msg, setMsg] = useState(""); const [q, setQ] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof DealInput>(k: K, v: DealInput[K]) => setEdit(e => e && ({ ...e, [k]: v }));
  const nameOf = new Map(products.map(p => [p.id, p.name]));
  const open = (d: DealRow) => setEdit({ id: d.id, name: d.name, kind: d.kind, buy_qty: d.buy_qty, get_qty: d.get_qty, percent_off: Number(d.percent_off), product_ids: d.product_ids ?? [], starts_on: day(d.starts_at), ends_on: day(d.ends_at), is_active: d.is_active });
  const save = () => edit && start(async () => { const r = await saveDeal(edit); if (!r.ok) { setMsg(r.message ?? "Could not save."); return; } setMsg(""); setEdit(null); router.refresh(); });
  const all = edit ? edit.product_ids.length === 0 : true; const shown = products.filter(p => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (id: string) => edit && set("product_ids", edit.product_ids.includes(id) ? edit.product_ids.filter(x => x !== id) : [...edit.product_ids, id]);
  return (<div className="space-y-5">
    <h1 className="font-display text-4xl font-semibold text-forest">Deals &amp; Sales</h1>
    <p className="text-sm text-ink/60">Automatic sales: the discount is added in the cart, at checkout and on the order, and checked again on the server. A single item only gets one deal, the one that saves the customer the most. A coupon code can still be used on top.</p>
    {dbError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{dbError}. Did you run supabase/migration-5.sql in Supabase → SQL Editor?</p>}
    {!edit && <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Start a new sale</h2>
      <div className="grid gap-3 sm:grid-cols-3">{PRESETS.map(p => <button key={p.label} type="button" onClick={() => { setEdit(p.make()); setMsg(""); setQ(""); }} className="rounded-xl border-2 border-forest/20 bg-white p-4 text-left hover:border-forest hover:bg-forest-100"><b className="block text-forest">{p.label}</b><span className="text-xs text-ink/60">{p.hint}</span></button>)}</div></section>}
    {edit && <section className={card}>
      <h2 className="mb-1 font-display text-2xl font-semibold text-forest">{edit.id ? "Edit deal" : "New deal"}: <span className="text-gold-dark">{dealTitle({ kind: edit.kind, buy_qty: edit.buy_qty, get_qty: edit.get_qty, percent_off: edit.percent_off })}</span></h2>
      <p className="mb-4 text-sm text-ink/60">This is what customers will see in their cart.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3"><label className={lbl} htmlFor="dn">Deal name (only for you)</label><input id="dn" className={inp} maxLength={80} value={edit.name} onChange={e => set("name", e.target.value)} /></div>
        <div><label className={lbl} htmlFor="dk">Type</label><select id="dk" className={inp} value={edit.kind} onChange={e => set("kind", e.target.value as DealInput["kind"])}><option value="buy_get">Buy some, get some discounted / free</option><option value="percent">Percent off</option></select></div>
        {edit.kind === "buy_get" ? <>
          <div><label className={lbl} htmlFor="db">Customer buys (qty)</label><input id="db" type="number" min={1} max={20} className={inp} value={edit.buy_qty} onChange={e => set("buy_qty", Number(e.target.value))} /></div>
          <div><label className={lbl} htmlFor="dg">Customer gets (qty)</label><input id="dg" type="number" min={1} max={20} className={inp} value={edit.get_qty} onChange={e => set("get_qty", Number(e.target.value))} /></div>
          <div><label className={lbl} htmlFor="dp">The “get” items are</label><select id="dp" className={inp} value={[100, 50].includes(edit.percent_off) ? edit.percent_off : "custom"} onChange={e => set("percent_off", e.target.value === "custom" ? 25 : Number(e.target.value))}><option value={100}>FREE (100% off)</option><option value={50}>Half price (50% off)</option><option value="custom">Custom % off…</option></select></div>
          {![100, 50].includes(edit.percent_off) && <div><label className={lbl} htmlFor="dc">% off the “get” items</label><input id="dc" type="number" min={1} max={100} className={inp} value={edit.percent_off} onChange={e => set("percent_off", Number(e.target.value))} /></div>}</>
          : <div><label className={lbl} htmlFor="dpc">Percent off</label><input id="dpc" type="number" min={1} max={100} className={inp} value={edit.percent_off} onChange={e => set("percent_off", Number(e.target.value))} /></div>}
        <div><label className={lbl} htmlFor="ds">Starts on (optional)</label><input id="ds" type="date" className={inp} value={edit.starts_on ?? ""} onChange={e => set("starts_on", e.target.value || undefined)} /></div>
        <div><label className={lbl} htmlFor="de">Ends on (optional)</label><input id="de" type="date" className={inp} value={edit.ends_on ?? ""} onChange={e => set("ends_on", e.target.value || undefined)} /></div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={edit.is_active} onChange={e => set("is_active", e.target.checked)} />Switched on</label></div>
      {edit.kind === "buy_get" && <p className="mt-3 rounded-lg bg-cream-dark p-3 text-xs text-ink/70">With a “Buy {edit.buy_qty} Get {edit.get_qty}” deal the cheapest items in every group of {edit.buy_qty + edit.get_qty} get the discount. Items can be mixed (different products from the list below count together).</p>}
      <div className="mt-5"><p className={lbl}>Applies to</p>
        <div className="flex flex-wrap gap-4 text-sm font-semibold"><label className="flex items-center gap-2"><input type="radio" name="scope" className="accent-forest" checked={all} onChange={() => set("product_ids", [])} />All products</label><label className="flex items-center gap-2"><input type="radio" name="scope" className="accent-forest" checked={!all} onChange={() => products[0] && set("product_ids", [products[0].id])} />Only selected products</label></div>
        {!all && <div className="mt-3"><input className={inp} placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search products" />
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-forest/15 p-2 text-sm">{shown.map(p => <li key={p.id}><label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-forest-100"><input type="checkbox" className="h-4 w-4 accent-forest" checked={edit.product_ids.includes(p.id)} onChange={() => toggle(p.id)} />{p.name}</label></li>)}{shown.length === 0 && <li className="p-2 text-ink/50">No products found.</li>}</ul>
          <p className="mt-1 text-xs text-ink/50">{edit.product_ids.length} selected</p></div>}</div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={save}>{pending ? "Saving…" : "Save deal"}</button><button className={btn2} onClick={() => { setEdit(null); setMsg(""); }}>Cancel</button>{msg && <p role="alert" className="text-sm text-red-700">⚠ {msg}</p>}</div></section>}
    {deals.length === 0 ? <p className={`${card} text-sm text-ink/60`}>No deals yet. Pick one of the buttons above to start.</p> :
      <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Deal</th><th className="p-3">Customers see</th><th className="p-3">Applies to</th><th className="p-3">Dates</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
        <tbody className="divide-y divide-forest/10">{deals.map(d => { const st = statusOf(d); return <tr key={d.id}><td className="p-3 font-bold">{d.name}</td><td className="p-3">{dealTitle(d)}</td>
          <td className="p-3">{d.product_ids?.length ? (d.product_ids.length <= 2 ? d.product_ids.map(i => nameOf.get(i) ?? "(removed product)").join(", ") : `${d.product_ids.length} products`) : "All products"}</td>
          <td className="p-3 text-xs">{d.starts_at || d.ends_at ? `${day(d.starts_at) ?? "…"} → ${day(d.ends_at) ?? "…"}` : "Always"}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.c}`}>{st.t}</span></td>
          <td className="flex flex-wrap gap-2 p-3"><button className={btn2} disabled={pending} onClick={() => start(async () => { await setDealActive(d.id, !d.is_active); router.refresh(); })}>{d.is_active ? "Turn off" : "Turn on"}</button><button className={btn2} onClick={() => { open(d); setMsg(""); setQ(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
            <button className={btnDanger} disabled={pending} onClick={() => confirm(`Delete “${d.name}”?`) && start(async () => { await deleteDeal(d.id); router.refresh(); })}>Delete</button></td></tr>; })}</tbody></table></div>}
  </div>);
}

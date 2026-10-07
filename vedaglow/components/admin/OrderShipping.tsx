"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buyLabel, getLabelRates, saveTracking } from "@/app/admin/actions";
import type { RateOption } from "@/types";
import { CARRIERS } from "@/lib/shipping/rules";
import { money } from "@/lib/format";
import { btn, btn2, inp, lbl } from "./ui";

export interface LabelInfo { carrier?: string; tracking_number?: string; tracking_url?: string; label_url?: string; label_cost?: number; shipped_at?: string }
/** Admin -> order: compare USPS / UPS / FedEx prices, buy the label, or type in a tracking number you bought elsewhere. */
export default function OrderShipping({ orderId, charged, chargedName, paid, parcel, label, mode, originOk, to }: {
  orderId: string; charged: number; chargedName: string; paid: string; parcel: { weight_oz?: number; l?: number; w?: number; h?: number }; label: LabelInfo; mode: "off" | "test" | "live"; originOk: boolean; to: string;
}) {
  const router = useRouter(); const [pending, start] = useTransition();
  const w0 = parcel.weight_oz ? { lb: Math.floor(parcel.weight_oz / 16), oz: Math.round((parcel.weight_oz % 16) * 10) / 10 } : { lb: 0, oz: 0 };
  const [lb, setLb] = useState(w0.lb ? String(w0.lb) : ""); const [oz, setOz] = useState(w0.oz ? String(w0.oz) : "");
  const [l, setL] = useState(String(parcel.l ?? 8)); const [w, setW] = useState(String(parcel.w ?? 6)); const [h, setH] = useState(String(parcel.h ?? 4));
  const [rates, setRates] = useState<RateOption[] | null>(null); const [pick, setPick] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [carrier, setCarrier] = useState<string>("USPS"); const [num, setNum] = useState("");
  const totalOz = (Number(lb) || 0) * 16 + (Number(oz) || 0);
  const cheapest = rates?.[0]; const fastest = rates ? [...rates].sort((a, b) => (a.days ?? 99) - (b.days ?? 99))[0] : undefined;
  const chosen = rates?.find(r => r.rate_id === pick);
  const done = (r: { ok: boolean; message?: string }) => { setMsg({ ok: r.ok, t: r.message ?? (r.ok ? "Done." : "Failed.") }); if (r.ok) router.refresh(); };

  const getRates = () => start(async () => {
    setMsg(null); setRates(null); setPick("");
    const r = await getLabelRates(orderId, { weight_oz: totalOz, l: Number(l), w: Number(w), h: Number(h) });
    if (!r.ok) { setMsg({ ok: false, t: r.message ?? "Could not get rates." }); return; }
    setRates(r.rates ?? []); setPick(r.rates?.[0]?.rate_id ?? "");
  });
  const buy = () => { if (!chosen) return; if (mode === "live" && !confirm(`Buy this label?\n${chosen.carrier} ${chosen.service}: ${money(chosen.amount)}\nThis charges your Shippo account.`)) return; start(async () => done(await buyLabel(orderId, chosen.rate_id))); };
  const saveManual = () => start(async () => done(await saveTracking(orderId, { carrier, tracking_number: num })));

  const diff = label.label_cost != null ? Math.round((charged - label.label_cost) * 100) / 100 : null;
  return (<div className="space-y-4">
    <div className="rounded-lg bg-cream p-3 text-sm"><b>Customer paid for shipping:</b> {charged > 0 ? money(charged) : "FREE"} <span className="text-ink/60">({chargedName})</span><br /><span className="text-ink/60">Ship to: {to}</span></div>
    {paid !== "paid" && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Payment is marked <b>{paid}</b>. Check the payment before you ship.</p>}

    {label.tracking_number ? <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
      <p className="font-semibold text-green-900">✓ Shipped with {label.carrier}</p>
      <p>Tracking: {label.tracking_url ? <a href={label.tracking_url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{label.tracking_number}</a> : <b>{label.tracking_number}</b>}</p>
      {label.label_url && <p><a href={label.label_url} target="_blank" rel="noopener noreferrer" className={`${btn} inline-block`}>Open / print label (PDF)</a></p>}
      {diff !== null && <p className="text-ink/70">You paid the carrier {money(label.label_cost!)}. {diff >= 0 ? `Shipping profit: ${money(diff)}.` : `Shipping cost you ${money(-diff)} more than the customer paid.`}</p>}
      {label.shipped_at && <p className="text-xs text-ink/50">{new Date(label.shipped_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>}
    </div> : <>
      <div className="rounded-xl border border-forest/10 p-4">
        <h3 className="mb-1 font-semibold text-forest">Compare prices &amp; buy a label</h3>
        {mode === "off" ? <p className="text-sm text-ink/70">Not connected yet. Add <b>SHIPPO_API_KEY</b> in Netlify → Environment variables, redeploy, and USPS / UPS / FedEx prices appear here. Until then, buy a label elsewhere and save the tracking number below.</p> : <>
          {mode === "test" && <p className="mb-2 rounded bg-blue-50 p-2 text-xs text-blue-900">TEST mode: prices are real examples, labels are fake and free.</p>}
          {!originOk && <p className="mb-2 rounded bg-amber-50 p-2 text-xs text-amber-900">Fill in your ship-from address in Settings first.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div><span className={lbl}>Weight (packed)</span><div className="flex items-center gap-2"><input aria-label="Pounds" type="number" min={0} className={inp} value={lb} placeholder="0" onChange={e => setLb(e.target.value)} /><span className="text-sm">lb</span><input aria-label="Ounces" type="number" min={0} step="0.1" className={inp} value={oz} placeholder="0" onChange={e => setOz(e.target.value)} /><span className="text-sm">oz</span></div></div>
            <div><span className={lbl}>Box size (in)</span><div className="flex items-center gap-1"><input aria-label="Length" type="number" min={0} step="0.1" className={inp} value={l} onChange={e => setL(e.target.value)} /><span>×</span><input aria-label="Width" type="number" min={0} step="0.1" className={inp} value={w} onChange={e => setW(e.target.value)} /><span>×</span><input aria-label="Height" type="number" min={0} step="0.1" className={inp} value={h} onChange={e => setH(e.target.value)} /></div></div></div>
          <button type="button" className={`${btn} mt-3`} disabled={pending || !originOk} onClick={getRates}>{pending && !rates ? "Getting prices…" : "Get rates"}</button>
          {rates && (rates.length === 0 ? <p className="mt-3 text-sm text-red-700">No rates came back.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-2" /><th className="p-2">Carrier &amp; service</th><th className="p-2">Delivery</th><th className="p-2 text-right">Price</th></tr></thead>
            <tbody className="divide-y divide-forest/10">{rates.map(r => <tr key={r.rate_id} className={pick === r.rate_id ? "bg-forest-100" : ""}>
              <td className="p-2"><input type="radio" name="rate" aria-label={`${r.carrier} ${r.service}`} checked={pick === r.rate_id} onChange={() => setPick(r.rate_id)} className="h-4 w-4 accent-forest" /></td>
              <td className="p-2"><b>{r.carrier}</b> {r.service}{r === cheapest && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-800">CHEAPEST</span>}{r === fastest && r !== cheapest && <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-800">FASTEST</span>}</td>
              <td className="p-2 text-ink/70">{r.days ? `~${r.days} day${r.days === 1 ? "" : "s"}` : r.terms ? "see terms" : "n/a"}</td><td className="p-2 text-right font-semibold">{money(r.amount)}</td></tr>)}</tbody></table>
            <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" className={btn} disabled={pending || !chosen} onClick={buy}>{pending ? "Working…" : chosen ? `Buy label · ${money(chosen.amount)}` : "Buy label"}</button>
              {chosen && <span className="text-xs text-ink/60">{chosen.amount <= charged ? `Customer paid ${money(charged)}: you keep ${money(charged - chosen.amount)}.` : `Customer paid ${money(charged)}: you add ${money(chosen.amount - charged)}.`}</span>}</div></div>)}</>}
      </div>
      <div className="rounded-xl border border-forest/10 p-4"><h3 className="mb-1 font-semibold text-forest">Already have a label? Save the tracking number</h3>
        <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]"><div><label className={lbl} htmlFor="mc">Carrier</label><select id="mc" className={inp} value={carrier} onChange={e => setCarrier(e.target.value)}>{CARRIERS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className={lbl} htmlFor="mn">Tracking number</label><input id="mn" className={inp} value={num} onChange={e => setNum(e.target.value)} placeholder="9400 1000 0000 0000 0000 00" /></div>
          <button type="button" className={`${btn2} self-end`} disabled={pending || num.trim().length < 6} onClick={saveManual}>Save tracking</button></div>
        <p className="mt-2 text-xs text-ink/50">Saving marks the order as shipped and shows the tracking link to the customer.</p></div></>}
    {msg && <p role="status" className={`rounded-lg p-3 text-sm font-medium ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}
  </div>);
}

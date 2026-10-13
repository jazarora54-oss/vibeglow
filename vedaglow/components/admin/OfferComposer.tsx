"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendOffers } from "@/app/admin/actions";
import { btn, card, inp, lbl } from "./ui";
export interface OfferProduct { id: string; name: string; price: number; interested: number; eligible: number }
export default function OfferComposer({ products, emailReady }: { products: OfferProduct[]; emailReady: boolean }) {
  const first = products.find(p => p.eligible > 0)?.id ?? products[0]?.id ?? "";
  const [pid, setPid] = useState(first), [kind, setKind] = useState<"percent" | "amount">("percent"), [value, setValue] = useState(10), [days, setDays] = useState(7), [message, setMessage] = useState("Here's your chance to get this item at a great price!");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const p = products.find(x => x.id === pid);
  return (<section className={card}>
    <h2 className="mb-1 font-display text-2xl font-semibold text-forest">Send offers</h2><p className="mb-4 text-sm text-ink/60">Encourage interested customers to buy. Each person gets their own single-use code for this product.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2"><label className={lbl} htmlFor="op">Product</label><select id="op" className={inp} value={pid} onChange={e => setPid(e.target.value)}>{products.map(x => <option key={x.id} value={x.id}>{x.name} — {x.eligible} interested</option>)}</select></div>
      <div><label className={lbl} htmlFor="ok">Discount type</label><select id="ok" className={inp} value={kind} onChange={e => setKind(e.target.value as "percent" | "amount")}><option value="percent">Percent off</option><option value="amount">Amount off ($)</option></select></div>
      <div><label className={lbl} htmlFor="ov">{kind === "percent" ? "Percent off (%)" : "Amount off ($)"}</label><input id="ov" type="number" min={1} max={kind === "percent" ? 90 : undefined} className={inp} value={value} onChange={e => setValue(Number(e.target.value))} />{p && kind === "percent" && value > 0 && <p className="mt-1 text-xs text-ink/50">New price: ${(p.price * (1 - value / 100)).toFixed(2)} (was ${p.price.toFixed(2)})</p>}</div>
      <div><label className={lbl} htmlFor="od">Offer lasts</label><select id="od" className={inp} value={days} onChange={e => setDays(Number(e.target.value))}>{[1, 3, 7, 14, 30].map(d => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}</select></div>
      <div className="md:col-span-2"><label className={lbl} htmlFor="om">Message <span className="font-normal normal-case">({message.length}/230)</span></label><textarea id="om" rows={3} maxLength={230} className={inp} value={message} onChange={e => setMessage(e.target.value)} /><p className="mt-1 text-xs text-ink/50">This message is included with the offer.</p></div></div>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button className={btn} disabled={pending || !p || p.eligible === 0 || !emailReady} onClick={() => confirm(`Send this offer to ${p?.eligible} customer(s)?`) && start(async () => { const r = await sendOffers({ product_id: pid, kind, value, days, message }); setMsg({ ok: r.ok, t: r.message ?? (r.ok ? "Sent" : "Failed") }); router.refresh(); })}>{pending ? "Sending…" : `Send offer to ${p?.eligible ?? 0} customer${p?.eligible === 1 ? "" : "s"}`}</button>
      {!emailReady && <span className="text-sm text-amber-800">Email is not set up yet (Settings → Email).</span>}
      {p && p.eligible === 0 && emailReady && <span className="text-sm text-ink/60">Nobody is waiting for this product yet.</span>}
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>
    <p className="mt-3 text-xs text-ink/50">Counter-offers (customers proposing their own price) are not available yet. Up to 100 customers per send.</p>
  </section>);
}

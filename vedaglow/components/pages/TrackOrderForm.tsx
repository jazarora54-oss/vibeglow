"use client";
import { useState } from "react";
import { trackOrder, type TrackResult } from "@/app/actions/store";
const inp = "w-full rounded-lg border border-forest/20 bg-white px-3 py-2.5 text-sm focus:border-forest focus:outline-none";
const STEPS = ["pending", "processing", "shipped", "delivered"];
const LABEL: Record<string, string> = { pending: "Order received", processing: "Preparing your order", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
export default function TrackOrderForm() {
  const [id, setId] = useState(""); const [email, setEmail] = useState(""); const [res, setRes] = useState<TrackResult | null>(null); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setRes(null); try { setRes(await trackOrder(id, email)); } catch { setRes({ ok: false, message: "Could not check right now. Please try again." }); } setBusy(false); };
  const o = res?.ok ? res.order : null; const at = o ? STEPS.indexOf(o.status) : -1;
  return (<>
    <form onSubmit={go} className="space-y-3 rounded-2xl border border-forest/10 bg-white p-5 shadow-card">
      <div><label htmlFor="to" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Order number</label><input id="to" required className={inp} value={id} onChange={e => setId(e.target.value)} placeholder="VDG-20260101-ABCDE" /></div>
      <div><label htmlFor="te" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Email</label><input id="te" type="email" required className={inp} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
      <button disabled={busy} className="w-full rounded-lg bg-forest px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-forest-500 disabled:opacity-50">{busy ? "CHECKING…" : "TRACK ORDER"}</button>
      {res && !res.ok && <p role="alert" className="text-sm font-medium text-red-700">{res.message}</p>}
    </form>
    {o && <div className="mt-6 space-y-4 rounded-2xl border border-forest/10 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-forest">{o.id}</b><span className="rounded-full bg-cream-dark px-3 py-1 text-sm font-semibold text-forest">{LABEL[o.status] ?? o.status}</span></div>
      {o.status !== "cancelled" && <ol className="grid grid-cols-4 gap-2 text-center text-xs">{STEPS.map((s, i) => <li key={s}><div className={`mx-auto mb-1 h-2 rounded-full ${i <= at ? "bg-forest" : "bg-forest/15"}`} /><span className={i <= at ? "font-semibold text-forest" : "text-ink/50"}>{LABEL[s]}</span></li>)}</ol>}
      {o.tracking_info && <p className="rounded-lg bg-cream p-3 text-sm"><b>Tracking:</b> {o.tracking_url && /^https?:\/\//.test(o.tracking_url) ? <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline">{o.tracking_info}</a> : o.tracking_info}</p>}
      {o.estimated_delivery && <p className="text-sm text-ink/70">Estimated delivery: {o.estimated_delivery}</p>}
      <ul className="divide-y divide-forest/10 text-sm">{o.items.map((i, k) => <li key={k} className="flex justify-between py-2"><span>{i.name}{i.variant_label ? ` · ${i.variant_label}` : ""}</span><span>× {i.quantity}</span></li>)}</ul>
      <p className="text-right text-sm font-semibold">Total: ${o.total.toFixed(2)}</p>
    </div>}
  </>);
}

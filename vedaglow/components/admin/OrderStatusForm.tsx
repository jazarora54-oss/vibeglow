"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrder } from "@/app/admin/actions";
import { btn, inp, lbl } from "./ui";
export default function OrderStatusForm({ id, status, payment, notes, tracking }: { id: string; status: string; payment: string; notes: string; tracking: string }) {
  const [s, setS] = useState(status), [p, setP] = useState(payment), [n, setN] = useState(notes), [tr, setTr] = useState(tracking); const [msg, setMsg] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  return (<div className="space-y-3">
    <div><label className={lbl} htmlFor="os">Order status</label><select id="os" className={inp} value={s} onChange={e => setS(e.target.value)}>{["pending", "processing", "shipped", "delivered", "cancelled"].map(x => <option key={x}>{x}</option>)}</select></div>
    <div><label className={lbl} htmlFor="ps">Payment</label><select id="ps" className={inp} value={p} onChange={e => setP(e.target.value)}>{["unpaid", "paid", "refunded"].map(x => <option key={x}>{x}</option>)}</select></div>
    <div><label className={lbl} htmlFor="tr">Tracking info (customer sees this)</label><input id="tr" className={inp} value={tr} onChange={e => setTr(e.target.value)} placeholder="e.g. USPS 9400… or courier link" /></div>
    <div><label className={lbl} htmlFor="on">Internal notes (private)</label><textarea id="on" rows={3} className={inp} value={n} onChange={e => setN(e.target.value)} /></div>
    <button className={btn} disabled={pending} onClick={() => start(async () => { const r = await updateOrder(id, { status: s, payment_status: p, notes: n, tracking_info: tr }); setMsg(r.ok ? "Saved ✓" : r.message ?? "Failed"); router.refresh(); })}>{pending ? "Saving…" : "Update order"}</button>{msg && <span className="ml-3 text-sm font-medium">{msg}</span>}
  </div>);
}

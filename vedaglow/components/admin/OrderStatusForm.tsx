"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrder } from "@/app/admin/actions";
import { btn, inp, lbl } from "./ui";
export default function OrderStatusForm({ id, status, payment, notes }: { id: string; status: string; payment: string; notes: string }) {
  const [s, setS] = useState(status), [p, setP] = useState(payment), [n, setN] = useState(notes); const [msg, setMsg] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  return (<div className="space-y-3">
    <div><label className={lbl} htmlFor="os">Order status</label><select id="os" className={inp} value={s} onChange={e => setS(e.target.value)}>{["pending", "processing", "shipped", "delivered", "cancelled"].map(x => <option key={x}>{x}</option>)}</select></div>
    <div><label className={lbl} htmlFor="ps">Payment</label><select id="ps" className={inp} value={p} onChange={e => setP(e.target.value)}>{["unpaid", "paid", "refunded"].map(x => <option key={x}>{x}</option>)}</select></div>
    <div><label className={lbl} htmlFor="on">Internal notes (tracking no., etc.)</label><textarea id="on" rows={3} className={inp} value={n} onChange={e => setN(e.target.value)} /></div>
    <button className={btn} disabled={pending} onClick={() => start(async () => { const r = await updateOrder(id, { status: s, payment_status: p, notes: n }); setMsg(r.ok ? "Saved ✓" : r.message ?? "Failed"); router.refresh(); })}>{pending ? "Saving…" : "Update order"}</button>{msg && <span className="ml-3 text-sm font-medium">{msg}</span>}
  </div>);
}

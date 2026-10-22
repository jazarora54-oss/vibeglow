"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundOrder } from "@/app/admin/actions";
import { btnDanger } from "./ui";
export default function OrderRefund({ id, amount }: { id: string; amount: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  return <div className="mt-4 border-t border-forest/10 pt-4"><p className="mb-2 text-sm font-semibold text-forest">Card payment (Stripe)</p>
    <button className={btnDanger} disabled={pending} onClick={() => { if (!window.confirm(`Refund the full ${amount} to the customer's card? This cannot be undone.`)) return; start(async () => { const r = await refundOrder(id); setMsg({ ok: r.ok, t: r.message ?? (r.ok ? "Done" : "Failed") }); router.refresh(); }); }}>{pending ? "Refunding…" : `Refund ${amount}`}</button>
    {msg && <p role="status" className={`mt-2 text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}
    <p className="mt-2 text-xs text-ink/50">Refunds the whole order through Stripe. Cancel the order separately if the stock should go back.</p></div>;
}

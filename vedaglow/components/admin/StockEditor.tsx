"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStock } from "@/app/admin/actions";
import { btn2, inp } from "./ui";
export default function StockEditor({ productId, variantId, qty }: { productId: string; variantId: string; qty: number }) {
  const [v, setV] = useState(String(qty)), [reason, setReason] = useState(""), [msg, setMsg] = useState(""), [p, go] = useTransition(); const router = useRouter();
  const dirty = v !== String(qty);
  return (<div className="flex flex-wrap items-center gap-2"><input aria-label="Stock quantity" type="number" min={0} max={100000} value={v} onChange={e => setV(e.target.value)} className={`${inp} !w-24`} />
    {dirty && <><input aria-label="Reason" value={reason} maxLength={200} onChange={e => setReason(e.target.value)} placeholder="Reason (e.g. new delivery)" className={`${inp} !w-48`} />
      <button className={btn2} disabled={p} onClick={() => go(async () => { const r = await setStock(productId, variantId, Number(v), reason); setMsg(r.message ?? ""); if (r.ok) { setReason(""); router.refresh(); } })}>{p ? "Saving…" : "Save"}</button></>}
    {msg && <span role="status" className="text-xs text-ink/60">{msg}</span>}</div>);
}

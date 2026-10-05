"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCoupon, saveCoupon, type CouponInput } from "@/app/admin/actions";
import { btn, btn2, btnDanger, card, inp, lbl } from "./ui";
export interface CouponRow { code: string; percent_off: number | null; amount_off: number | null; min_subtotal: number | null; usage_limit: number | null; used_count: number; expires_at: string | null; is_active: boolean }
const blank = (): CouponInput => ({ code: "", kind: "percent", value: 10, is_active: true, isNew: true });
export default function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const [edit, setEdit] = useState<CouponInput | null>(null); const [msg, setMsg] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof CouponInput>(k: K, v: CouponInput[K]) => setEdit(e => e && ({ ...e, [k]: v }));
  const save = () => edit && start(async () => { const r = await saveCoupon(edit); if (!r.ok) { setMsg(r.message ?? "Could not save."); return; } setMsg(""); setEdit(null); router.refresh(); });
  const open = (c: CouponRow) => setEdit({ code: c.code, kind: c.percent_off ? "percent" : "amount", value: Number(c.percent_off ?? c.amount_off ?? 0), min_subtotal: c.min_subtotal ?? undefined, usage_limit: c.usage_limit ?? undefined, expires_at: c.expires_at?.slice(0, 10), is_active: c.is_active, isNew: false });
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Coupons</h1>{!edit && <button className={btn} onClick={() => setEdit(blank())}>+ New coupon</button>}</div>
    {edit && <section className={card}><div className="grid gap-4 sm:grid-cols-3">
      <div><label className={lbl}>Code</label><input className={`${inp} uppercase`} disabled={!edit.isNew} value={edit.code} onChange={e => set("code", e.target.value)} placeholder="SUMMER15" /></div>
      <div><label className={lbl}>Type</label><select className={inp} value={edit.kind} onChange={e => set("kind", e.target.value as "percent" | "amount")}><option value="percent">Percent off (%)</option><option value="amount">Fixed amount off ($)</option></select></div>
      <div><label className={lbl}>Value</label><input type="number" min={0} step="0.01" className={inp} value={edit.value} onChange={e => set("value", Number(e.target.value))} /></div>
      <div><label className={lbl}>Minimum order ($, optional)</label><input type="number" min={0} className={inp} value={edit.min_subtotal ?? ""} onChange={e => set("min_subtotal", e.target.value ? Number(e.target.value) : undefined)} /></div>
      <div><label className={lbl}>Max uses (optional)</label><input type="number" min={1} className={inp} value={edit.usage_limit ?? ""} onChange={e => set("usage_limit", e.target.value ? Number(e.target.value) : undefined)} /></div>
      <div><label className={lbl}>Expires on (optional)</label><input type="date" className={inp} value={edit.expires_at ?? ""} onChange={e => set("expires_at", e.target.value || undefined)} /></div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={edit.is_active} onChange={e => set("is_active", e.target.checked)} />Active</label></div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={save}>{pending ? "Saving…" : "Save coupon"}</button><button className={btn2} onClick={() => { setEdit(null); setMsg(""); }}>Cancel</button>{msg && <p role="alert" className="text-sm text-red-700">⚠ {msg}</p>}</div></section>}
    {coupons.length === 0 ? <p className={`${card} text-sm text-ink/60`}>No coupons yet. (Until you add one here, customers can’t use any code.)</p> :
      <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min order</th><th className="p-3">Used</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
        <tbody className="divide-y divide-forest/10">{coupons.map(c => <tr key={c.code}><td className="p-3 font-bold">{c.code}</td><td className="p-3">{c.percent_off ? `${c.percent_off}%` : `$${c.amount_off}`}</td><td className="p-3">{c.min_subtotal ? `$${c.min_subtotal}` : "—"}</td><td className="p-3">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td><td className="p-3">{c.expires_at ? c.expires_at.slice(0, 10) : "—"}</td><td className="p-3">{c.is_active ? "Active" : "Off"}</td>
          <td className="flex gap-2 p-3"><button className={btn2} onClick={() => open(c)}>Edit</button><button className={btnDanger} disabled={pending} onClick={() => confirm(`Delete ${c.code}?`) && start(async () => { await deleteCoupon(c.code); router.refresh(); })}>Delete</button></td></tr>)}</tbody></table></div>}
  </div>);
}

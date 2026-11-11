"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkStock } from "@/app/admin/actions";
import StockEditor from "./StockEditor";
import { btn, btn2, inp } from "./ui";
type Row = { pid: string; vid: string; name: string; label: string; sku: string; qty: number; active: boolean };
/** The stock table with tick boxes: change many items at once, or set them all to zero (out of stock). */
export default function InventoryTable({ rows, lowAt, total }: { rows: Row[]; lowAt: number; total: number }) {
  const router = useRouter(); const [sel, setSel] = useState<Set<string>>(new Set()); const [val, setVal] = useState("0"), [reason, setReason] = useState(""), [msg, setMsg] = useState(""), [bad, setBad] = useState(false), [p, go] = useTransition();
  const key = (r: Row) => `${r.pid}|${r.vid}`; const all = rows.length > 0 && rows.every(r => sel.has(key(r)));
  const toggle = (k: string) => setSel(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const picked = useMemo(() => rows.filter(r => sel.has(key(r))).map(r => ({ pid: r.pid, vid: r.vid })), [rows, sel]);
  const tag = (n: number) => n <= 0 ? <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Out</span> : n <= lowAt ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Low</span> : null;
  const run = (mode: "set" | "add" | "zero") => {
    if (!picked.length) { setBad(true); setMsg("Tick at least one item first."); return; }
    const what = mode === "zero" ? `set ${picked.length} item(s) to ZERO (the website will show Out of stock)` : mode === "set" ? `set ${picked.length} item(s) to ${Number(val)}` : `add ${Number(val)} to ${picked.length} item(s)`; if (!confirm(`Really ${what}?`)) return;
    go(async () => { const r = await bulkStock(picked, mode, Number(val), reason); setBad(!r.ok); setMsg(r.message ?? ""); if (r.changed) { setSel(new Set()); router.refresh(); } });
  };
  return (<div className="space-y-3">
    <div className="rounded-2xl border border-forest/15 bg-cream p-3 text-sm"><p className="mb-2 font-semibold text-forest">Change many at once: tick the items below ({sel.size} ticked)</p>
      <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="bsv">Number</label><input id="bsv" type="number" min={0} max={100000} value={val} onChange={e => setVal(e.target.value)} className={`${inp} !w-24`} />
        <button className={btn2} disabled={p} onClick={() => run("set")}>Set all to this number</button><button className={btn2} disabled={p} onClick={() => run("add")}>Add this number to each</button><button className={btn} disabled={p} onClick={() => run("zero")}>Set to ZERO (out of stock)</button>
        <input aria-label="Reason" value={reason} maxLength={200} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)" className={`${inp} !w-56`} /></div>
      {msg && <p role="status" className={`mt-2 text-sm font-medium ${bad ? "text-red-700" : "text-green-800"}`}>{msg}</p>}
      <p className="mt-1 text-xs text-ink/60">Zero means customers see “Out of Stock” and cannot buy it. Every change is logged below.</p></div>
    <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr>
      <th className="w-10 p-3"><input type="checkbox" aria-label="Tick all shown" className="h-4 w-4 accent-forest" checked={all} onChange={e => setSel(e.target.checked ? new Set(rows.map(key)) : new Set())} /></th><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">Status</th><th className="p-3">In stock</th></tr></thead>
      <tbody className="divide-y divide-forest/10">{rows.length === 0 ? <tr><td className="p-4 text-ink/60" colSpan={5}>Nothing found.</td></tr> : rows.map(r => <tr key={key(r)} className={sel.has(key(r)) ? "bg-forest/5" : ""}>
        <td className="p-3"><input type="checkbox" aria-label={`Tick ${r.name}${r.label ? " " + r.label : ""}`} className="h-4 w-4 accent-forest" checked={sel.has(key(r))} onChange={() => toggle(key(r))} /></td>
        <td className="p-3"><Link href={`/admin/products/${r.pid}`} className="font-semibold text-forest hover:underline">{r.name}</Link>{r.label && <span className="text-ink/60"> · {r.label}</span>}{!r.active && <span className="ml-2 text-xs text-ink/50">(hidden)</span>}</td>
        <td className="p-3 text-ink/60">{r.sku || "—"}</td><td className="p-3">{tag(r.qty)}</td><td className="p-3"><StockEditor key={`${r.pid}|${r.vid}|${r.qty}`} productId={r.pid} variantId={r.vid} qty={r.qty} /></td></tr>)}</tbody></table></div>
    {total > rows.length && <p className="text-xs text-ink/60">Showing the first {rows.length} of {total}. Use the search or the Low / Out buttons to narrow the list.</p>}
  </div>);
}

import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/site";
import { fmtDateTime } from "@/lib/format";
import { card, inp, btn } from "@/components/admin/ui";
import InventoryTable from "@/components/admin/InventoryTable";
export const dynamic = "force-dynamic";
type Row = { pid: string; vid: string; name: string; label: string; sku: string; qty: number; active: boolean };
export default async function Page(props: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const sp = await props.searchParams; const q = (sp.q ?? "").trim().toLowerCase().slice(0, 80); const f = ["low", "out"].includes(sp.f ?? "") ? sp.f! : "all";
  const sb = serverClient(); const lowAt = (await getSiteSettings()).low_stock_at || 5;
  const [{ data: ps, error }, mv] = await Promise.all([sb.from("products").select("id,name,sku,stock,variants,is_active").order("name").limit(2000), sb.from("stock_movements").select("id,created_at,label,qty_before,qty_after,reason,by_email").order("created_at", { ascending: false }).limit(30)]);
  const rows: Row[] = (ps ?? []).flatMap((p: any) => Array.isArray(p.variants) && p.variants.length ? p.variants.map((v: any) => ({ pid: p.id, vid: v.id, name: p.name, label: v.label ?? "", sku: v.sku ?? "", qty: Number(v.stock) || 0, active: p.is_active })) : [{ pid: p.id, vid: "", name: p.name, label: "", sku: p.sku ?? "", qty: Number(p.stock) || 0, active: p.is_active }]);
  const list = rows.filter(r => (!q || `${r.name} ${r.label} ${r.sku}`.toLowerCase().includes(q)) && (f === "all" || (f === "out" ? r.qty <= 0 : r.qty > 0 && r.qty <= lowAt)));
  const tag = (n: number) => n <= 0 ? <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Out</span> : n <= lowAt ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Low</span> : null;
  const pill = (k: string, l: string) => <Link key={k} href={`/admin/inventory?${new URLSearchParams({ ...(k !== "all" ? { f: k } : {}), ...(q ? { q } : {}) })}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${f === k ? "bg-forest text-onforest" : "border border-forest/20 bg-white text-forest"}`}>{l}</Link>;
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Inventory</h1>
    <p className="text-sm text-ink/70">Type the real count and press Save. Sales and cancellations still update stock by themselves. Every manual change is logged below. “Low” = {lowAt} or fewer (change in Settings).</p>
    <form action="/admin/inventory" className="flex gap-2">{f !== "all" && <input type="hidden" name="f" value={f} />}<input name="q" defaultValue={q} placeholder="Search product, option or SKU" className={inp} aria-label="Search inventory" /><button className={btn}>Search</button></form>
    <div className="flex flex-wrap gap-2">{pill("all", `All ${rows.length}`)}{pill("low", `Low ${rows.filter(r => r.qty > 0 && r.qty <= lowAt).length}`)}{pill("out", `Out ${rows.filter(r => r.qty <= 0).length}`)}</div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}</p>}
    <InventoryTable rows={list.slice(0, 400)} lowAt={lowAt} total={list.length} />
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Recent manual changes</h2>
      {mv.error ? <p className="text-sm text-ink/60">{/stock_movements/.test(mv.error.message) ? "Run supabase/migration-12.sql in Supabase to turn on stock editing and history." : mv.error.message}</p> : (mv.data ?? []).length === 0 ? <p className="text-sm text-ink/60">No manual changes yet.</p> :
        <ul className="divide-y divide-forest/10 text-sm">{(mv.data ?? []).map((m: any) => <li key={m.id} className="py-2"><b>{m.label}</b>: {m.qty_before} → <b>{m.qty_after}</b> <span className="text-ink/60">· {fmtDateTime(m.created_at)}{m.by_email ? ` · ${m.by_email}` : ""}{m.reason ? ` · ${m.reason}` : ""}</span></li>)}</ul>}</section></div>);
}

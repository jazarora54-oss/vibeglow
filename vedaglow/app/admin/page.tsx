import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { card, STATUS_STYLE } from "@/components/admin/ui";
import { money } from "@/lib/format";
export default async function Dashboard() {
  const sb = serverClient();
  const [{ data: products }, { data: orders }] = await Promise.all([
    sb.from("products").select("id,name,stock,is_active,variants"), sb.from("orders").select("id,created_at,status,payment_status,customer_name,total").order("created_at", { ascending: false }).limit(500)]);
  const ps = products ?? [], os = orders ?? [];
  const live = os.filter(o => o.status !== "cancelled");
  const revenue = os.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const low = ps.filter(p => p.is_active && p.stock <= 5);
  const stats = [["Products", ps.length], ["Orders", live.length], ["New orders", os.filter(o => o.status === "pending").length], ["Paid revenue", money(revenue)]];
  return (<div className="space-y-6">
    <h1 className="font-display text-4xl font-semibold text-forest">Dashboard</h1>
    {ps.length === 0 && <div className={card}><p className="font-semibold">Your database has no products yet.</p><p className="mt-1 text-sm text-ink/70">Go to <Link className="font-semibold text-forest underline" href="/admin/products">Products</Link> and press “Import demo products”, or add your first product.</p></div>}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map(([k, v]) => <div key={k as string} className={card}><p className="text-xs uppercase tracking-wide text-ink/60">{k}</p><p className="mt-1 text-3xl font-semibold text-forest">{v}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Recent orders</h2>
        {os.length === 0 ? <p className="text-sm text-ink/60">No orders yet.</p> : <ul className="divide-y divide-forest/10">{os.slice(0, 6).map(o => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-forest"><span><b>{o.id}</b><br /><span className="text-ink/60">{o.customer_name}</span></span><span className="text-right"><b>{money(Number(o.total))}</b><br /><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[o.status]}`}>{o.status}</span></span></Link></li>)}</ul>}
        <Link href="/admin/orders" className="mt-3 inline-block text-sm font-semibold text-forest underline">All orders →</Link></section>
      <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Low / out of stock</h2>
        {low.length === 0 ? <p className="text-sm text-ink/60">All products are well stocked.</p> : <ul className="divide-y divide-forest/10">{low.map(p => <li key={p.id}><Link href={`/admin/products/${p.id}`} className="flex justify-between py-2.5 text-sm hover:text-forest"><span>{p.name}</span><b className={p.stock <= 0 ? "text-red-700" : "text-amber-700"}>{p.stock <= 0 ? "Out of stock" : `${p.stock} left`}</b></Link></li>)}</ul>}</section>
    </div>
  </div>);
}

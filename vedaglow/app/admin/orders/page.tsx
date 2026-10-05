import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { STATUS_STYLE } from "@/components/admin/ui";
import { money } from "@/lib/format";
const FILTERS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];
export default async function Page({ searchParams }: { searchParams: { status?: string } }) {
  const f = FILTERS.includes(searchParams.status ?? "") ? searchParams.status! : "all";
  let q = serverClient().from("orders").select("id,created_at,status,payment_status,customer_name,email,total").order("created_at", { ascending: false }).limit(200);
  if (f !== "all") q = q.eq("status", f);
  const { data, error } = await q; const os = data ?? [];
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Orders</h1>
    <div className="flex flex-wrap gap-2">{FILTERS.map(x => <Link key={x} href={x === "all" ? "/admin/orders" : `/admin/orders?status=${x}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${f === x ? "bg-forest text-white" : "border border-forest/20 bg-white text-forest"}`}>{x}</Link>)}</div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}</p>}
    {os.length === 0 ? <p className="rounded-2xl border border-forest/10 bg-white p-6 text-sm text-ink/60 shadow-card">No orders {f !== "all" ? `with status “${f}”` : "yet"}.</p> :
      <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Payment</th></tr></thead>
        <tbody className="divide-y divide-forest/10">{os.map(o => <tr key={o.id} className="hover:bg-cream/60"><td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-bold text-forest hover:underline">{o.id}</Link></td><td className="p-3">{new Date(o.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td><td className="p-3">{o.customer_name}<br /><span className="text-ink/50">{o.email}</span></td><td className="p-3 font-semibold">{money(Number(o.total))}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[o.status]}`}>{o.status}</span></td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[o.payment_status]}`}>{o.payment_status}</span></td></tr>)}</tbody></table></div>}
  </div>);
}

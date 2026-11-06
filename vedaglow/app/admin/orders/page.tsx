import { fmtDateTime, money } from "@/lib/format";
import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { STATUS_STYLE, inp, btn, btn2 } from "@/components/admin/ui";
import { STATUS_LIST, PAY_LIST, parseOrderQuery, applyOrderQuery, orderQs } from "@/lib/orderFilter";
export default async function Page(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const f = parseOrderQuery(await props.searchParams);
  const { data, error } = await applyOrderQuery(serverClient().from("orders").select("id,created_at,status,payment_status,customer_name,email,total,invoice_no").order("created_at", { ascending: false }).limit(200), f);
  const os = data ?? []; const qs = orderQs(f); const pill = (k: "status" | "pay", v: string) => { const g = { ...f, [k]: v }; const s = orderQs(g); return `/admin/orders${s ? `?${s}` : ""}`; };
  const filtered = qs !== "";
  return (<div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Orders</h1>
      <a href={`/admin/orders/export${qs ? `?${qs}` : ""}`} className={btn2}>Download CSV{filtered ? " (this filter)" : ""}</a></div>
    <form className="grid gap-3 rounded-2xl border border-forest/10 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]" action="/admin/orders">
      {f.status !== "all" && <input type="hidden" name="status" value={f.status} />}{f.pay !== "all" && <input type="hidden" name="pay" value={f.pay} />}
      <input name="q" defaultValue={f.q} placeholder="Search order no., name, email or invoice no." className={inp} aria-label="Search orders" />
      <input type="date" name="from" defaultValue={f.from} className={inp} aria-label="From date" /><input type="date" name="to" defaultValue={f.to} className={inp} aria-label="To date" />
      <div className="flex gap-2"><button className={btn}>Search</button>{filtered && <Link href="/admin/orders" className={btn2}>Clear</Link>}</div></form>
    <div className="space-y-2"><div className="flex flex-wrap gap-2"><span className="py-1.5 text-xs font-semibold uppercase text-ink/50">Status</span>{["all", ...STATUS_LIST].map(x => <Link key={x} href={pill("status", x)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${f.status === x ? "bg-forest text-white" : "border border-forest/20 bg-white text-forest"}`}>{x}</Link>)}</div>
      <div className="flex flex-wrap gap-2"><span className="py-1.5 text-xs font-semibold uppercase text-ink/50">Payment</span>{["all", ...PAY_LIST].map(x => <Link key={x} href={pill("pay", x)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${f.pay === x ? "bg-forest text-white" : "border border-forest/20 bg-white text-forest"}`}>{x}</Link>)}</div></div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}</p>}
    {os.length === 0 ? <p className="rounded-2xl border border-forest/10 bg-white p-6 text-sm text-ink/60 shadow-card">{filtered ? "No orders match this search." : "No orders yet."}</p> :
      <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3">Invoice</th><th className="p-3 text-right">Total</th></tr></thead>
        <tbody className="divide-y divide-forest/10">{os.map(o => <tr key={o.id} className="hover:bg-cream/60"><td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-bold text-forest hover:underline">{o.id}</Link></td><td className="p-3 text-ink/70">{fmtDateTime(o.created_at)}</td>
          <td className="p-3"><Link href={`/admin/customers/${encodeURIComponent(String(o.email).toLowerCase())}`} className="hover:underline">{o.customer_name || "—"}<br /><span className="text-xs text-ink/60">{o.email}</span></Link></td>
          <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[o.status] ?? ""}`}>{o.status}</span></td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[o.payment_status] ?? ""}`}>{o.payment_status}</span></td>
          <td className="p-3 text-xs text-ink/60">{o.invoice_no ?? "—"}</td><td className="p-3 text-right font-semibold">{money(Number(o.total))}</td></tr>)}</tbody></table></div>}
    {os.length === 200 && <p className="text-xs text-ink/60">Showing the newest 200. Use search or dates to narrow, or download the CSV.</p>}
  </div>);
}

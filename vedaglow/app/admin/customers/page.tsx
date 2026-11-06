import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { fmtDate, money } from "@/lib/format";
import { buildCustomers, SEGMENTS, type Segment } from "@/lib/customers";
import { btn, btn2, inp, card } from "@/components/admin/ui";
const SEGS: ("all" | Segment)[] = ["all", "VIP", "Repeat", "New", "Inactive"];
async function loadCustomers() {
  const sb = serverClient();
  const [o, s] = await Promise.all([sb.from("orders").select("email,customer_name,phone,total,created_at,status,is_test,data").limit(10000), sb.from("newsletter_subscribers").select("email").eq("unsubscribed", false).not("confirmed_at", "is", null).limit(50000)]);
  let rows: any[] | null = o.data; let err = o.error?.message;
  if (o.error) { const o2 = await sb.from("orders").select("email,customer_name,phone,total,created_at,status,data").limit(10000); rows = o2.data; err = o2.error?.message; }
  return { customers: buildCustomers(rows ?? [], new Set((s.data ?? []).map(r => String(r.email).toLowerCase()))), error: err };
}
export default async function Page(props: { searchParams: Promise<{ seg?: string; q?: string }> }) {
  const sp = await props.searchParams; const seg = SEGS.includes(sp.seg as any) ? (sp.seg as string) : "all"; const q = (sp.q ?? "").trim().toLowerCase().slice(0, 80);
  const { customers, error } = await loadCustomers();
  const list = customers.filter(c => (seg === "all" || c.segment === seg) && (!q || c.email.includes(q) || c.name.toLowerCase().includes(q)));
  const href = (g: string) => `/admin/customers?${new URLSearchParams({ ...(g !== "all" ? { seg: g } : {}), ...(q ? { q } : {}) })}`;
  return (<div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Customers</h1><a href="/admin/customers/export" className={btn2}>Download CSV</a></div>
    <p className="text-sm text-ink/70">Built from real orders (cancelled and test orders are not counted). This page is private. “Marketing OK” means the person confirmed their newsletter email – nobody else may receive promotional email.</p>
    <form action="/admin/customers" className="flex gap-2">{seg !== "all" && <input type="hidden" name="seg" value={seg} />}<input name="q" defaultValue={q} placeholder="Search name or email" className={inp} aria-label="Search customers" /><button className={btn}>Search</button></form>
    <div className="flex flex-wrap gap-2">{SEGS.map(x => <Link key={x} href={href(x)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${seg === x ? "bg-forest text-white" : "border border-forest/20 bg-white text-forest"}`}>{x === "all" ? "All" : x} {x === "all" ? customers.length : customers.filter(c => c.segment === x).length}</Link>)}</div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {list.length === 0 ? <p className={`${card} text-sm text-ink/60`}>No customers found.</p> : <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Customer</th><th className="p-3">Segment</th><th className="p-3 text-right">Orders</th><th className="p-3 text-right">Spent</th><th className="p-3">Last order</th><th className="p-3">Marketing OK</th></tr></thead>
      <tbody className="divide-y divide-forest/10">{list.slice(0, 500).map(c => <tr key={c.email} className="hover:bg-cream/60"><td className="p-3"><Link href={`/admin/customers/${encodeURIComponent(c.email)}`} className="font-bold text-forest hover:underline">{c.name || c.email}</Link><br /><span className="text-xs text-ink/60">{c.email}</span></td><td className="p-3">{c.segment}</td><td className="p-3 text-right">{c.orders}</td><td className="p-3 text-right font-semibold">{money(c.spent)}</td><td className="p-3 text-ink/70">{fmtDate(c.last)}</td><td className="p-3">{c.marketing ? "Yes" : "No"}</td></tr>)}</tbody></table></div>}
    <p className="text-xs text-ink/60">Segments: VIP = {SEGMENTS.vipOrders}+ orders or {money(SEGMENTS.vipSpend)}+ spent · Inactive = no order for {SEGMENTS.inactiveDays}+ days · Repeat = 2 orders · New = 1 order. (Adjust in lib/customers.ts.)</p></div>);
}

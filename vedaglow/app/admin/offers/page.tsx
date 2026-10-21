import { fmtDate } from "@/lib/format";
import { serverClient } from "@/lib/supabase/server";
import { emailConfigured } from "@/lib/email";
import OfferComposer, { type OfferProduct } from "@/components/admin/OfferComposer";
import { card } from "@/components/admin/ui";
import type { TemporaryOrder } from "@/types";
export default async function Page() {
  const sb = serverClient();
  const [{ data: prods }, { data: subs, error }, { data: ords }, { data: offers }] = await Promise.all([
    sb.from("products").select("id,name,price").eq("is_active", true).order("name"),
    sb.from("offer_subscribers").select("product_id,email").eq("unsubscribed", false).limit(10000),
    sb.from("orders").select("email,data").neq("status", "cancelled").limit(3000),
    sb.from("offers").select("*").order("created_at", { ascending: false }).limit(15)]);
  const buyers = new Map<string, Set<string>>(); for (const o of ords ?? []) for (const i of ((o.data as TemporaryOrder)?.items ?? [])) { const s = buyers.get(i.product_id) ?? new Set<string>(); s.add(String(o.email).toLowerCase()); buyers.set(i.product_id, s); }
  const interested = new Map<string, string[]>(); for (const x of subs ?? []) interested.set(x.product_id, [...(interested.get(x.product_id) ?? []), String(x.email).toLowerCase()]);
  const products: OfferProduct[] = (prods ?? []).map(p => { const list = interested.get(p.id) ?? []; return { id: p.id, name: p.name, price: Number(p.price), interested: list.length, eligible: list.filter(e => !buyers.get(p.id)?.has(e)).length }; }).sort((a, b) => b.eligible - a.eligible);
  const nameOf = new Map((prods ?? []).map(p => [p.id, p.name]));
  return (<div className="space-y-6"><h1 className="font-display text-4xl font-semibold text-forest">Offers</h1>
    <p className="text-sm text-ink/60">Customers who click “Notify me” on a product page (and have not bought it) appear here. Send them a discount, like eBay’s “Send offers”.</p>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}. Did you run supabase/migration-3.sql?</p>}
    <OfferComposer products={products} emailReady={emailConfigured()} />
    <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Offers sent</h2>
      {(offers ?? []).length === 0 ? <p className="text-sm text-ink/60">No offers sent yet.</p> : <ul className="divide-y divide-forest/10 text-sm">{(offers ?? []).map(o => <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2.5"><span><b>{nameOf.get(o.product_id) ?? o.product_id}</b> · {o.kind === "percent" ? `${o.value}% off` : `$${o.value} off`} · {o.days} days</span><span className="text-ink/60">{o.sent_count} sent · {fmtDate(o.created_at)}</span></li>)}</ul>}</section></div>);
}

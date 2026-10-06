import Link from "next/link";
import { notFound } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import { card } from "@/components/admin/ui";
import { money } from "@/lib/format";
import type { Address, TemporaryOrder } from "@/types";
const Addr = ({ a }: { a: Address }) => <address className="text-sm not-italic leading-relaxed">{a.first_name} {a.last_name}<br />{a.address1}{a.address2 && <>, {a.address2}</>}<br />{a.city}, {a.state} {a.zip}<br />{a.country}</address>;
export default async function Page({ params }: { params: { id: string } }) {
  const { data } = await serverClient().from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const o = data.data as TemporaryOrder; const s = o.summary;
  return (<div className="space-y-5"><Link href="/admin/orders" className="text-sm font-semibold text-forest underline">← All orders</Link>
    <h1 className="font-display text-4xl font-semibold text-forest">{data.id}</h1><p className="text-sm text-ink/60">Placed {new Date(data.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Items</h2>
          <ul className="divide-y divide-forest/10">{o.items.map((i, k) => <li key={k} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="flex items-center gap-3">{i.image ? <img src={i.image} alt="" className="h-12 w-12 rounded object-contain" /> : <span className="h-12 w-12 rounded bg-cream-dark" />}<span><b>{i.name}</b>{i.variant_label && <> · {i.variant_label}</>}<br /><span className="text-ink/60">{i.sku && `SKU ${i.sku} · `}{money(i.unit_price)} × {i.quantity}</span></span></span><b>{money(i.line_total)}</b></li>)}</ul>
          <dl className="mt-4 space-y-1 border-t border-forest/10 pt-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(s.subtotal)}</dd></div>{s.discount > 0 && <div className="flex justify-between"><dt>Discount {s.coupon_code && `(${s.coupon_code})`}</dt><dd>−{money(s.discount)}</dd></div>}<div className="flex justify-between"><dt>Shipping ({o.shipping_method.name})</dt><dd>{s.shipping ? money(s.shipping) : "Free"}</dd></div>{s.tax > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{money(s.tax)}</dd></div>}<div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{money(s.total)}</dd></div></dl></section>
        <section className={`${card} grid gap-5 sm:grid-cols-2`}><div><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Ship to</h2><Addr a={o.checkout.shipping_address} /><p className="mt-2 text-sm">{o.checkout.contact.email}<br />{o.checkout.contact.phone}</p></div><div><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Billing</h2><Addr a={o.checkout.billing_address} /></div></section>
      </div>
      <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Manage</h2><OrderStatusForm id={data.id} status={data.status} payment={data.payment_status} notes={data.notes ?? ""} tracking={data.tracking_info ?? ""} /></section>
    </div></div>);
}

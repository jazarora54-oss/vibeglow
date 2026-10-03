"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { TemporaryOrder } from "@/types";
import { getOrder } from "@/lib/orders";
import OrderSummary from "@/components/cart/OrderSummary"; import CheckoutSummary from "@/components/checkout/CheckoutSummary"; import CheckoutSteps from "@/components/checkout/CheckoutSteps";
export default function OrderConfirmation({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<TemporaryOrder | null | undefined>(undefined);
  useEffect(() => setOrder(getOrder(orderId)), [orderId]);
  if (order === undefined) return <div className="px-4 py-24 text-center text-ink/50" aria-busy="true">Loading your order…</div>;
  if (!order) return <div className="mx-auto max-w-lg px-4 py-20 text-center"><h1 className="font-display text-3xl font-semibold text-forest">Order not found</h1><p className="mt-2 text-ink/70">We couldn&apos;t find order {orderId} on this device.</p><Link href="/shop" className="mt-6 inline-block rounded-lg bg-forest px-8 py-3.5 text-sm font-semibold text-white">CONTINUE SHOPPING</Link></div>;
  const a = order.checkout.shipping_address; const b = order.checkout.billing_address;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <CheckoutSteps current={5} />
      <div className="mt-8 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-white"><Check size={32} /></span>
        <h1 className="mt-4 font-display text-4xl font-semibold text-forest">✓ ORDER CONFIRMED</h1><p className="mt-2 text-ink/70">Thank you for your order!</p>
        <p className="mt-3 text-sm text-ink/60">Order Number</p><p className="text-xl font-bold tracking-wide text-gold-dark">{order.id}</p>
        <p className="mx-auto mt-3 max-w-md rounded-lg bg-cream-dark p-3 text-xs text-ink/70">This is a demo order saved on this device only. No payment was taken and no confirmation email is sent yet.</p></div>
      <div id="order-details" className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Shipping address</h2>
            <address className="text-sm not-italic leading-relaxed">{a.first_name} {a.last_name}<br />{a.address1}{a.address2 && <>, {a.address2}</>}<br />{a.city}, {a.state} {a.zip}<br />{a.country}</address>
            <p className="mt-2 text-sm text-ink/60">{order.checkout.contact.email} · {order.checkout.contact.phone}</p></section>
          <section className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Delivery</h2>
            <p className="text-sm">{order.shipping_method.name}</p><p className="text-sm text-ink/70">Estimated delivery: {order.estimated_delivery}</p>
            {!order.checkout.billing_same_as_shipping && <p className="mt-2 text-xs text-ink/60">Billing: {b.first_name} {b.last_name}, {b.address1}, {b.city}</p>}</section>
        </div>
        <div className="space-y-5"><CheckoutSummary items={order.items.map(i => ({ ...i }))} summary={order.summary} method={order.shipping_method} />
          <div className="grid gap-3"><Link href="/shop" className="rounded-lg bg-forest py-4 text-center text-sm font-semibold tracking-wide text-white hover:bg-forest-500">CONTINUE SHOPPING</Link>
            <a href="#order-details" className="rounded-lg border-2 border-forest py-3.5 text-center text-sm font-semibold tracking-wide text-forest">VIEW ORDER</a></div></div>
      </div>
    </div>
  );
}

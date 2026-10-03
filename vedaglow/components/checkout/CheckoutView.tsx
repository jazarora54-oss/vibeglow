"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import EmptyCart from "@/components/cart/EmptyCart"; import CouponBox from "@/components/cart/CouponBox";
import { calculateSummary, getShippingMethod } from "@/lib/cart/cartCalculations";
import { DEFAULT_SHIPPING_ID } from "@/lib/cart/config";
import { cartIssues, getLiveStock } from "@/lib/cart/validate";
import { createOrder } from "@/lib/orders";
import { emptyAddress, validateAddress, validateContact, type Errors } from "@/lib/checkout/validation";
import type { Address, CustomerInformation } from "@/types";
import AddressForm from "./AddressForm"; import CheckoutSteps from "./CheckoutSteps"; import CheckoutSummary from "./CheckoutSummary"; import ContactForm from "./ContactForm"; import DeliveryMethod from "./DeliveryMethod"; import PaymentPlaceholder from "./PaymentPlaceholder";
const prefixErr = (e: Errors, p: string): Errors => Object.fromEntries(Object.entries(e).map(([k, v]) => [`${p}${k}`, v]));
const strip = (e: Errors, p: string): Errors => Object.fromEntries(Object.entries(e).filter(([k]) => k.startsWith(p)).map(([k, v]) => [k.slice(p.length), v]));
export default function CheckoutView() {
  const { items, ready, coupon, syncStock, clearCart, notify } = useCart(); const router = useRouter();
  const [contact, setContact] = useState<CustomerInformation>({ email: "", phone: "" });
  const [ship, setShip] = useState<Address>(emptyAddress()); const [bill, setBill] = useState<Address>(emptyAddress()); const [same, setSame] = useState(true);
  const [delivery, setDelivery] = useState(DEFAULT_SHIPPING_ID); const [pay, setPay] = useState(""); const [errors, setErrors] = useState<Errors>({}); const [formMsg, setFormMsg] = useState(""); const [placing, setPlacing] = useState(false);
  useEffect(() => { if (ready && items.length) getLiveStock(items).then(syncStock); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready]);
  if (placing) return <div className="px-4 py-24 text-center text-ink/60" role="status">Placing your order…</div>;
  if (!ready) return <div className="px-4 py-24 text-center text-ink/50" aria-busy="true">Loading checkout…</div>;
  if (!items.length) return <div className="px-4 py-12 sm:py-16"><EmptyCart title="NOTHING TO CHECK OUT" /></div>;
  const summary = calculateSummary(items, coupon, delivery); const method = getShippingMethod(delivery); const issues = cartIssues(items);
  const infoOk = !Object.keys(validateContact(contact)).length && !Object.keys(validateAddress(ship)).length;
  const step = pay ? 4 : infoOk ? 3 : 2;
  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    const live = await getLiveStock(items); syncStock(live);
    const fresh = items.map(i => ({ ...i, max_stock: live[`${i.product_id}:${i.variant_id ?? "-"}`] ?? i.max_stock }));
    const bad = cartIssues(fresh); if (bad.length) { setFormMsg(bad[0].message); return; }
    const errs = { ...validateContact(contact), ...prefixErr(validateAddress(ship), "ship_"), ...(same ? {} : prefixErr(validateAddress(bill), "bill_")) };
    setErrors(errs); if (Object.keys(errs).length) { setFormMsg("Please fix the highlighted fields."); setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 0); return; }
    setFormMsg(""); setPlacing(true);
    const order = createOrder(fresh, { contact, shipping_address: ship, billing_address: same ? ship : bill, billing_same_as_shipping: same, shipping_method_id: delivery, payment_method: pay || "Not selected (demo)" }, coupon);
    notify("Order confirmed."); router.push(`/order-confirmation/${order.id}`); setTimeout(clearCart, 400);
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-4xl font-semibold text-forest">Checkout</h1>
      <div className="my-6"><CheckoutSteps current={step} /></div>
      <form noValidate onSubmit={place} className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          <ContactForm value={contact} onChange={setContact} errors={errors} />
          <fieldset className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><legend className="sr-only">Shipping address</legend>
            <h2 className="mb-4 font-display text-2xl font-semibold text-forest">SHIPPING ADDRESS</h2><AddressForm prefix="ship" value={ship} onChange={setShip} errors={strip(errors, "ship_")} />
            <label className="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" checked={same} onChange={e => setSame(e.target.checked)} className="h-4 w-4 accent-forest" />Billing address same as shipping address</label>
            {!same && <div className="mt-5 border-t border-forest/10 pt-5"><h3 className="mb-3 font-semibold">Billing address</h3><AddressForm prefix="bill" value={bill} onChange={setBill} errors={strip(errors, "bill_")} /></div>}</fieldset>
          <DeliveryMethod subtotal={summary.subtotal} value={delivery} onChange={setDelivery} />
          <PaymentPlaceholder value={pay} onChange={setPay} />
        </div>
        <div className="space-y-4 min-w-0"><CheckoutSummary items={items} summary={summary} method={method} />
          <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><CouponBox idPrefix="co" /></div>
          {(formMsg || issues.length > 0) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">⚠ {formMsg || issues[0].message}</p>}
          <button type="submit" disabled={issues.length > 0} className="w-full rounded-lg bg-forest py-4 text-sm font-semibold tracking-wide text-white hover:bg-forest-500 disabled:cursor-not-allowed disabled:bg-ink/30">PLACE ORDER</button>
          <p className="text-center text-xs text-ink/50">Demo order: no payment is taken in this step.</p>
          <Link href="/cart" className="block text-center text-sm font-semibold text-forest underline-offset-4 hover:underline">← Back to cart</Link></div>
      </form>
    </div>
  );
}

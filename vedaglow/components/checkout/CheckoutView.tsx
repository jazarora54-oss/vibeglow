"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import EmptyCart from "@/components/cart/EmptyCart"; import CouponBox from "@/components/cart/CouponBox";
import { calculateSummary } from "@/lib/cart/cartCalculations";
import { lineFromCart, planShipping, toShippingMethod } from "@/lib/shipping/rules";
import { getShippingQuote } from "@/app/actions/shipping";
import { cartIssues, getLiveStock } from "@/lib/cart/validate";
import { createOrder, storeOrderLocally } from "@/lib/orders";
import { submitOrder } from "@/app/actions/store";
import { emptyAddress, validateAddress, validateContact, type Errors } from "@/lib/checkout/validation";
import type { Address, CustomerInformation, ShippingOption } from "@/types";
import AddressForm from "./AddressForm"; import CheckoutSteps from "./CheckoutSteps"; import CheckoutSummary from "./CheckoutSummary"; import ContactForm from "./ContactForm"; import DeliveryMethod, { type QuoteState } from "./DeliveryMethod"; import PaymentPlaceholder from "./PaymentPlaceholder";
const prefixErr = (e: Errors, p: string): Errors => Object.fromEntries(Object.entries(e).map(([k, v]) => [`${p}${k}`, v]));
const strip = (e: Errors, p: string): Errors => Object.fromEntries(Object.entries(e).filter(([k]) => k.startsWith(p)).map(([k, v]) => [k.slice(p.length), v]));
export default function CheckoutView() {
  const { items, ready, coupon, syncStock, clearCart, notify, shipCfg } = useCart(); const router = useRouter();
  const [contact, setContact] = useState<CustomerInformation>({ email: "", phone: "" });
  const [ship, setShip] = useState<Address>(emptyAddress()); const [bill, setBill] = useState<Address>(emptyAddress()); const [same, setSame] = useState(true);
  const [delivery, setDelivery] = useState(""); const [options, setOptions] = useState<ShippingOption[]>([]); const [quote, setQuote] = useState<QuoteState>({ status: "idle" }); const [nonce, setNonce] = useState(0); const [pay, setPay] = useState(""); const [errors, setErrors] = useState<Errors>({}); const [formMsg, setFormMsg] = useState(""); const [placing, setPlacing] = useState(false);
  useEffect(() => { if (ready && items.length) getLiveStock(items).then(syncStock); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready]);
  // Shipping choices come from the server. They are asked for again whenever the cart or the delivery address changes.
  const linesKey = JSON.stringify(items.map(i => [i.product_id, i.variant_id ?? "", i.quantity]));
  const addrKey = [ship.address1, ship.address2, ship.city, ship.state, ship.zip, ship.country].join("|");
  useEffect(() => {
    if (!ready || !items.length) return; let stale = false;
    const t = setTimeout(async () => {
      setQuote(q => ({ ...q, status: "loading" }));
      try {
        const r = await getShippingQuote({ items: items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })), address: ship, contact });
        if (stale) return;
        setOptions(r.options); setQuote(r.ok ? { status: "ready", message: r.message, needsAddress: r.needsAddress } : { status: "error", message: r.message ?? "Shipping is not available for this order." });
        setDelivery(cur => r.options.some(o => o.id === cur) ? cur : r.options[0]?.id ?? "");
      } catch { if (!stale) { setOptions([]); setQuote({ status: "error", message: "We could not get shipping prices. Please check your connection." }); } }
    }, 500);
    return () => { stale = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, linesKey, addrKey, nonce]);
  if (placing) return <div className="px-4 py-24 text-center text-ink/60" role="status">Placing your order…</div>;
  if (!ready) return <div className="px-4 py-24 text-center text-ink/50" aria-busy="true">Loading checkout…</div>;
  if (!items.length) return <div className="px-4 py-12 sm:py-16"><EmptyCart title="NOTHING TO CHECK OUT" /></div>;
  const chosen = options.find(o => o.id === delivery); const method = chosen ? toShippingMethod(chosen) : undefined; const handlingDays = planShipping(items.map(lineFromCart), 0, shipCfg).handlingDays;
  const summary = calculateSummary(items, coupon, chosen ? { amount: chosen.price } : { amount: 0, pending: true }); const issues = cartIssues(items);
  const infoOk = !Object.keys(validateContact(contact)).length && !Object.keys(validateAddress(ship)).length;
  const step = pay ? 4 : infoOk ? 3 : 2;
  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosen) { setFormMsg(quote.status === "error" ? quote.message ?? "Shipping is not available." : "Please enter your address and choose a shipping option."); return; }
    const live = await getLiveStock(items); syncStock(live);
    const fresh = items.map(i => ({ ...i, max_stock: live[`${i.product_id}:${i.variant_id ?? "-"}`] ?? i.max_stock }));
    const bad = cartIssues(fresh); if (bad.length) { setFormMsg(bad[0].message); return; }
    const errs = { ...validateContact(contact), ...prefixErr(validateAddress(ship), "ship_"), ...(same ? {} : prefixErr(validateAddress(bill), "bill_")) };
    setErrors(errs); if (Object.keys(errs).length) { setFormMsg("Please fix the highlighted fields."); setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 0); return; }
    setFormMsg(""); setPlacing(true);
    const checkout = { contact, shipping_address: ship, billing_address: same ? ship : bill, billing_same_as_shipping: same, shipping_method_id: chosen.id, payment_method: pay || "Not selected (demo)" };
    let order = null as ReturnType<typeof createOrder> | null;
    try {
      const r = await submitOrder({ items: fresh.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })), checkout, coupon_code: coupon?.code, expected_shipping: chosen.price });
      if (r.status === "error") { setPlacing(false); setFormMsg(r.message); setNonce(n => n + 1); return; }
      if (r.status === "ok") order = storeOrderLocally(r.order);
    } catch { setPlacing(false); setFormMsg("We couldn't place your order. Please check your connection and try again."); return; }
    if (!order) order = createOrder(fresh, checkout, coupon, chosen); // backend not connected yet: demo order on this device
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
          <DeliveryMethod state={quote} options={options} value={delivery} onChange={setDelivery} handlingDays={handlingDays} />
          <PaymentPlaceholder value={pay} onChange={setPay} />
        </div>
        <div className="space-y-4 min-w-0"><CheckoutSummary items={items} summary={summary} method={method} />
          <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><CouponBox idPrefix="co" /></div>
          {(formMsg || issues.length > 0) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">⚠ {formMsg || issues[0].message}</p>}
          <button type="submit" disabled={issues.length > 0 || !chosen} className="w-full rounded-lg bg-forest py-4 text-sm font-semibold tracking-wide text-white hover:bg-forest-500 disabled:cursor-not-allowed disabled:bg-ink/30">PLACE ORDER</button>
          <p className="text-center text-xs text-ink/50">Demo order: no payment is taken in this step.</p>
          <Link href="/cart" className="block text-center text-sm font-semibold text-forest underline-offset-4 hover:underline">← Back to cart</Link></div>
      </form>
    </div>
  );
}

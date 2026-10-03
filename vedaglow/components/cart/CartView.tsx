"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { calculateSummary } from "@/lib/cart/cartCalculations";
import { cartIssues, getLiveStock } from "@/lib/cart/validate";
import CartList from "./CartList"; import CouponBox from "./CouponBox"; import EmptyCart from "./EmptyCart"; import OrderSummary from "./OrderSummary"; import ShippingProgress from "./ShippingProgress";
export default function CartView() {
  const { items, ready, coupon, count, syncStock } = useCart(); const router = useRouter(); const [msg, setMsg] = useState("");
  useEffect(() => { if (ready && items.length) getLiveStock(items).then(syncStock); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready, items.length]);
  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-ink/50" aria-busy="true">Loading your cart…</div>;
  if (!items.length) return <div className="px-4 py-12 sm:py-16"><EmptyCart /></div>;
  const summary = calculateSummary(items, coupon); const issues = cartIssues(items);
  const proceed = async () => {
    const live = await getLiveStock(items); syncStock(live);
    const fresh = items.map(i => ({ ...i, max_stock: live[`${i.product_id}:${i.variant_id ?? "-"}`] ?? i.max_stock }));
    const bad = cartIssues(fresh); if (bad.length) { setMsg(bad[0].message); return; } setMsg(""); router.push("/checkout");
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-4xl font-semibold text-forest">Shopping Cart</h1>
      <p className="mt-1 text-ink/60">{count} {count === 1 ? "Item" : "Items"}</p>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4"><ShippingProgress subtotal={summary.subtotal} /><CartList items={items} /><Link href="/shop" className="inline-block text-sm font-semibold text-forest underline-offset-4 hover:underline">← Continue shopping</Link></div>
        <aside className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="mb-4 font-display text-2xl font-semibold text-forest">ORDER SUMMARY</h2>
          <OrderSummary summary={summary} /><div className="mt-5 border-t border-forest/10 pt-5"><CouponBox /></div>
          {(msg || issues.length > 0) && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">⚠ {msg || issues[0].message}</p>}
          <button type="button" onClick={proceed} disabled={issues.length > 0} className="mt-5 w-full rounded-lg bg-forest py-4 text-sm font-semibold tracking-wide text-white hover:bg-forest-500 disabled:cursor-not-allowed disabled:bg-ink/30">PROCEED TO CHECKOUT</button>
          <p className="mt-3 text-center text-xs text-ink/50">Shipping is an estimate. Final totals are confirmed at checkout.</p>
        </aside>
      </div>
    </div>
  );
}

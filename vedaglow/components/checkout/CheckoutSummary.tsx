import type { CartItem, OrderSummary as Summary, ShippingMethod } from "@/types";
import CartThumb from "@/components/cart/CartThumb"; import OrderSummary from "@/components/cart/OrderSummary";
import { money } from "@/lib/format";
export default function CheckoutSummary({ items, summary, method }: { items: Pick<CartItem, "name" | "image" | "visual" | "quantity" | "unit_price" | "variant_label">[]; summary: Summary; method?: ShippingMethod }) {
  return <aside className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card lg:sticky lg:top-28" aria-label="Order summary">
    <h2 className="mb-4 font-display text-2xl font-semibold text-forest">ORDER SUMMARY</h2>
    <ul className="mb-5 space-y-3">{items.map((i, n) => <li key={n} className="flex items-center gap-3"><div className="relative"><CartThumb item={i} className="h-14 w-14" /><span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[11px] font-bold text-white">{i.quantity}</span></div>
      <div className="min-w-0 flex-1 text-sm"><p className="truncate font-medium">{i.name}</p>{i.variant_label && <p className="text-xs text-ink/60">{i.variant_label}</p>}</div><b className="text-sm">{money(i.unit_price * i.quantity)}</b></li>)}</ul>
    <OrderSummary summary={summary} context="checkout" />
    {method && <p className="mt-4 text-xs text-ink/60">Delivery: {method.name} ({method.eta})</p>}
  </aside>;
}

"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { lineKey, useCart } from "@/components/CartProvider";
import QuantitySelector from "@/components/product/QuantitySelector";
import { calculateSummary } from "@/lib/cart/cartCalculations";
import { money } from "@/lib/format";
import CartThumb from "./CartThumb"; import ShippingProgress from "./ShippingProgress";
export default function MiniCart() {
  const { miniOpen, setMiniOpen, items, coupon, count, setQuantity, removeItem, notify } = useCart(); const closeRef = useRef<HTMLButtonElement>(null); const path = usePathname();
  useEffect(() => { setMiniOpen(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [path]);
  useEffect(() => {
    if (!miniOpen) return; closeRef.current?.focus(); const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const on = (e: KeyboardEvent) => e.key === "Escape" && setMiniOpen(false); window.addEventListener("keydown", on);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", on); };
  }, [miniOpen, setMiniOpen]);
  if (!miniOpen) return null; const s = calculateSummary(items, coupon);
  return (
    <div className="fixed inset-0 z-[55]"><div className="absolute inset-0 bg-black/45" onClick={() => setMiniOpen(false)} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label="Shopping cart" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-lift">
        <div className="flex items-center justify-between border-b border-forest/10 px-5 py-4"><h2 className="font-display text-2xl font-semibold text-forest">Your Cart ({count})</h2>
          <button ref={closeRef} type="button" onClick={() => setMiniOpen(false)} aria-label="Close cart" className="grid h-10 w-10 place-items-center rounded-full hover:bg-forest-100"><X /></button></div>
        {!items.length ? <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"><p className="text-ink/70">Your cart is empty.</p><Link href="/shop" className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white">CONTINUE SHOPPING</Link></div> : <>
          <ul className="flex-1 space-y-3 overflow-y-auto p-4">{items.map(i => { const k = lineKey(i); return (
            <li key={k} className="flex gap-3 rounded-xl bg-white p-3 shadow-card"><CartThumb item={i} className="h-16 w-16" />
              <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><Link href={`/product/${i.slug}`} className="truncate text-sm font-semibold text-forest">{i.name}</Link>
                <button type="button" onClick={() => { removeItem(k); notify("Item removed."); }} aria-label={`Remove ${i.name}`} className="text-ink/40 hover:text-red-700"><X size={16} /></button></div>
                {i.variant_label && <p className="text-xs text-ink/60">{i.variant_label}</p>}
                {(i.max_stock ?? 1) <= 0 ? <p className="mt-1 text-xs font-semibold text-red-700">⚠ OUT OF STOCK</p> : <div className="mt-1.5 flex items-center justify-between"><QuantitySelector value={i.quantity} max={i.max_stock ?? 99} onChange={q => setQuantity(k, q)} /><b className="text-sm">{money(i.unit_price * i.quantity)}</b></div>}
              </div></li>); })}</ul>
          <div className="space-y-3 border-t border-forest/10 bg-white p-4"><ShippingProgress subtotal={s.subtotal} />
            <div className="flex justify-between text-lg"><span>Subtotal</span><b className="text-forest">{money(s.subtotal)}</b></div>
            <div className="grid grid-cols-2 gap-3"><Link href="/cart" className="rounded-lg border-2 border-forest py-3 text-center text-sm font-semibold text-forest">VIEW CART</Link><Link href="/checkout" className="rounded-lg bg-forest py-3 text-center text-sm font-semibold text-white">CHECKOUT</Link></div></div></>}
      </aside></div>
  );
}

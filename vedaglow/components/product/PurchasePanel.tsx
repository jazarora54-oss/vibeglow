"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell, Check, Heart } from "lucide-react";
import { money } from "@/lib/format";
import { useCart } from "@/components/CartProvider";
import Stars from "@/components/ui/Stars";
import QuantitySelector from "./QuantitySelector";
import StockStatus from "./StockStatus";
import { useSelection } from "./ProductSelection";
import { DEFAULT_HANDLING_DAYS, shippingBadge } from "@/lib/shipping/rules";
export default function PurchasePanel() {
  const { product, variant: v, price, compare, pct, stock, sku, out, qty, setQty, sizes, colors, choose, added, add, buyNow } = useSelection();
  const [notify, setNotify] = useState<"idle" | "form" | "done">("idle");
  const { toggleWishlist, wishlist, shipCfg } = useCart(); const liked = wishlist.includes(product.id);
  const ship = shippingBadge(product, shipCfg); const hd = product.handling_days ?? DEFAULT_HANDLING_DAYS;
  const vs = product.variants ?? [];
  const opt = (on: boolean, empty: boolean) => `rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${on ? "border-forest bg-forest-100 text-forest" : "border-forest/15 bg-white hover:border-forest/50"} ${empty ? "text-ink/40 line-through" : ""}`;
  const group = (kind: "size" | "color", label: string, vals: string[]) => (
    <div className="mt-6"><p className="mb-2 text-sm font-semibold">{label}: <span className="font-normal text-ink/70">{v?.[kind]}</span></p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>{vals.map(x => { const on = v?.[kind] === x; const empty = vs.filter(y => y[kind] === x).every(y => y.stock <= 0);
        return <button type="button" key={x} role="radio" aria-checked={on} aria-label={empty ? `${x}, out of stock` : x} onClick={() => choose(kind, x)} className={opt(on, empty)}>{x}</button>; })}</div></div>);
  return (
    <div className="min-w-0">
      {product.brand && <p className="text-sm text-ink/60">Brand: <span className="font-medium text-ink/80">{product.brand}</span></p>}
      <h1 className="mt-1 font-display text-4xl font-semibold leading-tight text-forest sm:text-5xl">{product.name}</h1>
      <div className="mt-3 flex items-center gap-3"><Stars value={product.rating} /><span className="font-semibold">{product.rating.toFixed(1)}</span>
        <a href="#reviews" className="text-sm text-forest underline-offset-4 hover:underline">{product.review_count} Reviews</a></div>
      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-bold text-forest">{money(price)}</span>
        {pct > 0 && <><span className="text-lg text-ink/50 line-through">{money(compare!)}</span><span className="rounded-md bg-red-700 px-2.5 py-1 text-xs font-bold text-white">SAVE {pct}%</span></>}
      </div>
      <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink/80">{product.short_description}</p>
      {sizes.length > 0 && group("size", "Size", sizes)}
      {colors.length > 0 && group("color", "Color", colors)}
      {sku && <p className="mt-4 text-xs text-ink/50">SKU: {sku}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-5"><QuantitySelector value={qty} max={stock} onChange={setQty} /><StockStatus stock={stock} /></div>
      <div className="mt-5 rounded-xl border border-forest/10 bg-white p-4 text-sm sm:max-w-md" aria-label="Shipping">
        <p className={`font-semibold ${ship.kind === "free" ? "text-forest-500" : "text-forest"}`}>🚚 {ship.text}{ship.kind === "calc" && <span className="font-normal text-ink/60"> (USPS, UPS or FedEx)</span>}</p>
        <p className="mt-1 text-xs text-ink/60">Ships within {hd === 0 ? "the same day" : `${hd} business day${hd === 1 ? "" : "s"}`}. Delivery estimate shown at checkout.</p>
        {ship.kind !== "free" && shipCfg.freeOver > 0 && <p className="mt-1 text-xs font-medium text-gold-dark">Free shipping on orders over {money(shipCfg.freeOver)}.</p>}</div>
      <div id="purchase-actions" className="mt-6 grid gap-3 sm:max-w-md">
        <button type="button" onClick={add} disabled={out} className="rounded-lg bg-forest py-4 text-sm font-semibold tracking-wide text-white hover:bg-forest-500 disabled:cursor-not-allowed disabled:bg-ink/30">{out ? "OUT OF STOCK" : "ADD TO CART"}</button>
        <button type="button" onClick={buyNow} disabled={out} className="rounded-lg border-2 border-gold bg-white py-4 text-sm font-semibold tracking-wide text-gold-dark hover:bg-gold hover:text-white disabled:cursor-not-allowed disabled:border-ink/20 disabled:text-ink/30 disabled:hover:bg-white">BUY IT NOW</button>
        {out && (notify === "done" ? <p className="rounded-lg bg-forest-100 p-3 text-center text-sm font-medium text-forest">Thanks! We&apos;ll let you know when it&apos;s back.</p> :
          notify === "form" ? <form onSubmit={e => { e.preventDefault(); setNotify("done"); }} className="flex gap-2"><label className="sr-only" htmlFor="nm">Email</label><input id="nm" type="email" required placeholder="Your email" className="min-w-0 flex-1 rounded-lg border border-forest/20 px-3 py-3 text-sm" /><button type="submit" className="rounded-lg bg-gold px-4 text-sm font-semibold text-white">NOTIFY ME</button></form> :
          <button type="button" onClick={() => setNotify("form")} className="flex items-center justify-center gap-2 rounded-lg border-2 border-forest py-4 text-sm font-semibold tracking-wide text-forest hover:bg-forest hover:text-white"><Bell size={16} />NOTIFY ME WHEN AVAILABLE</button>)}
        <button type="button" onClick={() => toggleWishlist(product.id)} aria-pressed={liked} className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-forest hover:text-red-700"><Heart size={18} className={liked ? "fill-red-700 text-red-700" : ""} />{liked ? "Saved to wishlist" : "Add to wishlist"}</button>
      </div>
      {added && <div role="status" className="fade-in mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/50 bg-white p-4 shadow-card sm:max-w-md">
        <span className="flex items-center gap-2 font-semibold text-forest"><span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-white"><Check size={15} /></span>Added to your cart</span>
        <Link href="/cart" className="text-sm font-semibold text-gold-dark underline-offset-4 hover:underline">View Cart</Link></div>}
    </div>
  );
}

"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { discountPct, money } from "@/lib/format";
import { useCart } from "@/components/CartProvider";
import Stars from "@/components/ui/Stars";
import ProductImage from "./ProductImage";
import { shippingBadge } from "@/lib/shipping/rules";
export default function ProductCard({ product, layout = "grid" }: { product: Product; layout?: "grid" | "list" }) {
  const list = layout === "list";
  const { addToCart, toggleWishlist, wishlist, shipCfg } = useCart(); const ship = shippingBadge(product, shipCfg);
  const pct = discountPct(product); const liked = wishlist.includes(product.id);
  return (
    <article className={`group flex ${list ? "flex-row gap-4 sm:gap-6" : "flex-col"} rounded-2xl border border-forest/10 bg-white p-3 shadow-card transition-shadow hover:shadow-lift sm:p-4`}>
      <div className={`relative ${list ? "w-32 shrink-0 sm:w-44" : ""}`}>
        {pct > 0 && <span className="absolute left-0 top-0 rounded-md bg-red-700 px-2 py-0.5 text-xs font-semibold text-white">-{pct}%</span>}
        <button onClick={() => toggleWishlist(product.id)} aria-pressed={liked} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full border border-forest/10 bg-white text-forest hover:text-red-700">
          <Heart size={16} className={liked ? "fill-red-700 text-red-700" : ""} />
        </button>
        <Link href={`/product/${product.slug}`} className="block"><ProductImage product={product} className="mx-auto h-40 w-full sm:h-48" /></Link>
      </div>
      <div className={list ? "flex min-w-0 flex-1 flex-col justify-center" : "contents"}>
      <Link href={`/product/${product.slug}`} className="mt-3 text-sm font-semibold leading-snug hover:text-forest">{product.name}</Link>
      <p className="mt-0.5 text-xs text-ink/60">{product.short_description}</p>
      <div className="mt-2"><Stars value={product.rating} count={product.review_count} /></div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-bold text-forest">{money(product.price)}</span>
        {pct > 0 && <span className="text-xs text-ink/50 line-through">{money(product.compare_at_price!)}</span>}
      </div>
      <p className={`mt-1 text-xs ${ship.kind === "free" ? "font-semibold text-forest-500" : "text-ink/60"}`}>{ship.kind === "free" ? "🚚 " : ""}{ship.text}</p>
      <button onClick={() => addToCart(product)} disabled={product.stock <= 0} className="mt-3 w-full disabled:cursor-not-allowed disabled:bg-ink/30 sm:disabled:hover:bg-ink/30 rounded-md bg-forest py-2.5 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-forest-500">{product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}</button>
      </div>
    </article>
  );
}

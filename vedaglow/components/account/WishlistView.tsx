"use client";
import Link from "next/link";
import type { Product } from "@/types";
import { useCart } from "@/components/CartProvider";
import ProductGrid from "@/components/product/ProductGrid";
export default function WishlistView({ products }: { products: Product[] }) {
  const { wishlist, ready } = useCart();
  if (!ready) return <p className="py-16 text-center text-ink/50" aria-busy="true">Loading your wishlist…</p>;
  const mine = products.filter(p => wishlist.includes(p.id));
  if (!mine.length) return <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-gold/50 bg-white px-6 py-14 text-center shadow-card"><h2 className="font-display text-3xl font-semibold text-forest">YOUR WISHLIST IS EMPTY</h2><p className="mt-2 text-ink/70">Tap the heart on any product to save it here.</p><Link href="/shop" className="mt-6 inline-block rounded-lg bg-forest px-8 py-3.5 text-sm font-semibold tracking-wide text-white hover:bg-forest-500">BROWSE PRODUCTS</Link></div>;
  return <ProductGrid products={mine} columns={4} />;
}

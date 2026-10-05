import type { Metadata } from "next";
import { getProducts } from "@/lib/data/products";
import WishlistView from "@/components/account/WishlistView";
export const metadata: Metadata = { title: "VEDAGLOW | Wishlist" };
export default async function Page() {
  const products = await getProducts();
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><h1 className="mb-6 font-display text-4xl font-semibold text-forest">My Wishlist</h1><WishlistView products={products} /></div>;
}

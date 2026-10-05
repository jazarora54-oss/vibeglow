import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "VEDAGLOW | My Account" };
export default function Page() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-semibold text-forest">My Account</h1>
      <p className="mt-3 text-ink/70">Customer sign-in and order history are coming soon. You can shop and check out as a guest right now.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/shop" className="rounded-lg bg-forest px-7 py-3 text-sm font-semibold tracking-wide text-white hover:bg-forest-500">CONTINUE SHOPPING</Link><Link href="/wishlist" className="rounded-lg border border-forest/25 bg-white px-7 py-3 text-sm font-semibold tracking-wide text-forest">MY WISHLIST</Link></div>
    </div>
  );
}

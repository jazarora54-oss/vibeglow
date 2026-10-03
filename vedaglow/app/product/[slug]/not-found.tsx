import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
      <h1 className="font-display text-5xl font-semibold text-forest">Product not found</h1>
      <p className="mt-3 text-ink/70">This product may have been moved or is no longer available.</p>
      <div className="mt-8 flex gap-3"><Link href="/shop" className="rounded-md bg-forest px-6 py-3 text-sm font-semibold text-white hover:bg-forest-500">SHOP ALL</Link><Link href="/" className="rounded-md border border-gold px-6 py-3 text-sm font-semibold text-forest">HOME</Link></div>
    </div>
  );
}

import Link from "next/link";
export default function EmptyCart({ title = "YOUR CART IS EMPTY" }: { title?: string }) {
  return <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-gold/50 bg-white px-6 py-14 text-center shadow-card">
    <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#E4EFE6" /><path d="M60 88C42 74 36 58 44 44c8-12 16-4 16 8 0-12 8-20 16-8 8 14 2 30-16 44z" fill="#0F3D26" /><path d="M60 52v36" stroke="#D9B35C" strokeWidth="3" strokeLinecap="round" /></svg>
    <h1 className="mt-5 font-display text-3xl font-semibold text-forest">{title}</h1>
    <p className="mt-2 text-ink/70">Looks like you haven&apos;t added anything yet.</p>
    <Link href="/shop" className="mt-6 inline-block rounded-lg bg-forest px-8 py-3.5 text-sm font-semibold tracking-wide text-white hover:bg-forest-500">CONTINUE SHOPPING</Link>
  </div>;
}

import { BadgeCheck } from "lucide-react";
import type { Product, Review } from "@/types";
import { getRatingBreakdown } from "@/lib/data/reviews";
import Stars from "@/components/ui/Stars";
import WriteReview from "./WriteReview";
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "";
export default function ProductReviews({ product, reviews }: { product: Product; reviews: Review[] }) {
  const rows = getRatingBreakdown(product.review_count); const demo = reviews.some(r => r.is_demo);
  return (
    <section id="reviews" aria-labelledby="rv" className="mx-auto max-w-7xl scroll-mt-40 px-4 pt-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="rv" className="font-display text-3xl font-semibold text-forest">Customer Reviews</h2><WriteReview /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-card">
          <p className="font-display text-5xl font-semibold text-forest">{product.rating.toFixed(1)} <span className="text-2xl text-ink/50">/ 5</span></p>
          <div className="mt-1"><Stars value={product.rating} /></div><p className="mt-1 text-sm text-ink/60">{product.review_count} Reviews</p>
          <ul className="mt-5 space-y-2" aria-label="Rating breakdown">{rows.map(r => <li key={r.stars} className="flex items-center gap-3 text-sm"><span className="w-12 shrink-0">{r.stars} star{r.stars > 1 ? "s" : ""}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-dark"><span className="block h-full rounded-full bg-gold" style={{ width: `${r.pct}%` }} /></span><span className="w-8 text-right text-ink/60">{r.count}</span></li>)}</ul>
        </div>
        <div>
          {demo && <p className="mb-3 text-xs text-ink/50">Sample reviews shown for demonstration only. They are not from real customers.</p>}
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{reviews.map(r => (
            <li key={r.id} className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-2"><b>{r.customer_name}</b><span className="text-xs text-ink/50">{fmt(r.created_at)}</span></div>
              {r.verified && <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-forest-500"><BadgeCheck size={14} />Verified Purchase</p>}
              <div className="mt-2"><Stars value={r.rating} /></div><p className="mt-2 text-ink/80">“{r.body}”</p></li>))}</ul>
        </div>
      </div>
    </section>
  );
}

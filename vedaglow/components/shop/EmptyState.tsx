import Link from "next/link";
import { SearchX } from "lucide-react";
export default function EmptyState({ clearHref }: { clearHref: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-gold/50 bg-white px-6 py-16 text-center">
      <SearchX size={40} strokeWidth={1.3} className="text-gold" />
      <h2 className="mt-4 font-display text-2xl font-semibold text-forest">No products found</h2>
      <p className="mt-1 text-ink/60">Try changing your filters or search.</p>
      <Link href={clearHref} className="mt-6 rounded-md bg-forest px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-forest-500">CLEAR FILTERS</Link>
    </div>
  );
}

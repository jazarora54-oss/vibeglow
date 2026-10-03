import Link from "next/link";
import type { Category } from "@/types";
export default function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-label="Shop by category">
      <ul className="flex gap-5 overflow-x-auto pb-2 sm:justify-between sm:gap-3">
        {categories.map(c => (
          <li key={c.id} className="shrink-0"><Link href={c.href} className="group flex w-24 flex-col items-center gap-3 sm:w-28">
            <span className="grid h-20 w-20 place-items-center rounded-full border border-gold/30 text-center font-display text-lg font-semibold text-forest transition-transform group-hover:scale-105 sm:h-24 sm:w-24" style={{ background: c.tone }}>
              {c.slug === "sale" ? "SALE" : c.slug === "new-arrivals" ? "NEW" : c.name[0]}
            </span>
            <span className="text-center text-sm font-medium">{c.name}</span>
          </Link></li>))}
      </ul>
    </section>
  );
}

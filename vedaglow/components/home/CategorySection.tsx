import Link from "next/link";
import type { Category } from "@/types";
export default function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-label="Shop by category">
      <ul className="flex gap-5 overflow-x-auto pb-2 sm:justify-between sm:gap-3">
        {categories.map(c => (
          <li key={c.id} className="shrink-0"><Link href={c.href} className="group flex w-24 flex-col items-center gap-3 sm:w-28">
            <span className="relative grid h-20 w-20 place-items-center rounded-full p-[3px] text-center font-display text-lg font-semibold text-forest shadow-[0_10px_20px_-6px_rgb(var(--forest)/0.45)] ring-1 ring-gold/40 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:h-24 sm:w-24" style={{ background: `linear-gradient(145deg, #fff, ${c.tone})` }}>
              <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-white shadow-[inset_0_-6px_10px_rgb(var(--forest)/0.18)]" style={{ background: c.image_url ? "#fff" : c.tone }}>
                {c.image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : c.slug === "sale" ? "SALE" : c.slug === "new-arrivals" ? "NEW" : c.name[0]}
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute left-2 top-1.5 h-5 w-8 rotate-[-30deg] rounded-full bg-white/50 blur-[2px]" />
            </span>
            <span className="text-center text-sm font-medium">{c.name}</span>
          </Link></li>))}
      </ul>
    </section>
  );
}

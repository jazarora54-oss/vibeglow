import type { StoreCategory } from "@/types";
/** Shown on a category page when no banner has been uploaded in Category Design: category name, short line and the category picture, in a colour of its own. Smaller than the homepage banner. */
const PAL: [string, string][] = [["#0B3B2A", "#157A5C"], ["#053A3D", "#1FA6A0"], ["#5B2A5F", "#C2548F"], ["#7A4A12", "#D9A441"], ["#143A5A", "#3C8DBC"], ["#3E5A1C", "#8DB84A"]];
const pal = (slug: string) => { let h = 0; for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PAL[h % PAL.length]; };
export default function DefaultCategoryHero({ cat }: { cat: Pick<StoreCategory, "slug" | "name" | "blurb" | "image_url"> }) {
  const [a, b] = pal(cat.slug);
  return (
    <section aria-label={`${cat.name} banner`} className="relative overflow-hidden text-white" style={{ background: `linear-gradient(110deg, ${a}, ${b})` }}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-1/4 -top-10 h-56 w-56 rounded-full bg-gold/25 blur-3xl" />
      <div className="relative mx-auto flex min-h-[170px] max-w-7xl items-center justify-between gap-6 px-4 py-8 sm:min-h-[220px] sm:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">VEDAGLOW</p>
          <h2 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">{cat.name}</h2>
          {cat.blurb && <p className="mt-2 text-base text-white/85 sm:text-lg">{cat.blurb}</p>}
        </div>
        {cat.image_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={cat.image_url} alt="" className="hidden h-36 w-36 shrink-0 rounded-2xl border-2 border-white/60 object-cover shadow-xl sm:block sm:h-44 sm:w-44" />}
      </div>
    </section>
  );
}

import Link from "next/link";
import type { Product } from "@/types";
import ProductGrid from "./ProductGrid";
export default function ProductSection({ title, subtitle, products, href, tabs }: { title: string; subtitle?: string; products: Product[]; href?: string; tabs?: string[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-display text-3xl font-semibold text-forest">{title}</h2>{subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}</div>
        <div className="flex items-center gap-5 text-sm">
          {tabs?.map((t, i) => <span key={t} className={i === 0 ? "rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white" : "hidden text-ink/60 sm:inline"}>{t}</span>)}
          {href && <Link href={href} className="font-semibold text-forest underline-offset-4 hover:underline">View all</Link>}
        </div>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

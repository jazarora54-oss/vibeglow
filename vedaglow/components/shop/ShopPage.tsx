import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { parseQuery, type ShopLock } from "@/lib/shop";
import { queryProducts } from "@/lib/data/products";
import ProductGrid from "@/components/product/ProductGrid";
import ShopToolbar from "./ShopToolbar";
import FilterSidebar from "./FilterSidebar";
import EmptyState from "./EmptyState";
interface Props { title: string; subtitle: string; path: string; crumbs: { label: string; href?: string }[]; searchParams: Record<string, string | string[] | undefined>; lock?: ShopLock }
/** Server component shared by /shop, /new-arrivals, /sale and /category/[slug]. */
export default async function ShopPage({ title, subtitle, path, crumbs, searchParams, lock }: Props) {
  const q = parseQuery(searchParams);
  if (lock?.category) q.category = [lock.category];
  if (lock?.special === "new") q.isNew = true; if (lock?.special === "sale") q.onSale = true;
  const products = await queryProducts(q);
  const heading = q.search ? `Results for “${q.search}”` : title;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink/60">
        <Link href="/" className="hover:text-forest">Home</Link>
        {crumbs.map(c => <span key={c.label} className="flex items-center gap-1"><ChevronRight size={14} />{c.href ? <Link href={c.href} className="hover:text-forest">{c.label}</Link> : <span className="text-forest">{c.label}</span>}</span>)}
      </nav>
      <h1 className="font-display text-4xl font-semibold text-forest sm:text-5xl">{heading}</h1>
      <p className="mb-8 mt-2 max-w-2xl text-ink/70">{q.search ? `Searching all VEDAGLOW products.` : subtitle}</p>
      <div className="flex gap-8">
        <FilterSidebar lock={lock} />
        <div className="min-w-0 flex-1">
          <ShopToolbar count={products.length} lock={lock} />
          {products.length ? <ProductGrid products={products} layout={q.view} columns={4} /> : <EmptyState clearHref={path} />}
        </div>
      </div>
    </div>
  );
}

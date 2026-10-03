import type { Product } from "@/types";
import ProductCard from "./ProductCard";
interface Props { products: Product[]; layout?: "grid" | "list"; columns?: 4 | 5 }
export default function ProductGrid({ products, layout = "grid", columns = 5 }: Props) {
  if (!products.length) return <p className="py-10 text-center text-ink/60">No products found yet.</p>;
  if (layout === "list") return <div className="flex flex-col gap-4">{products.map(p => <ProductCard key={p.id} product={p} layout="list" />)}</div>;
  return <div className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 ${columns === 5 ? "xl:grid-cols-5" : ""}`}>{products.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}

export const CATEGORY_OPTIONS = [
  { slug: "skin-care", name: "Skin Care", blurb: "Explore our collection of skin care products." },
  { slug: "hair-care", name: "Hair Care", blurb: "Explore our collection of hair care products." },
  { slug: "body-care", name: "Body Care", blurb: "Explore our collection of body care products." },
  { slug: "health-wellness", name: "Health & Wellness", blurb: "Explore our collection of health and wellness products." },
  { slug: "oral-care", name: "Oral Care", blurb: "Explore our collection of oral care products." },
];
export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" }, { value: "newest", label: "Newest" }, { value: "best-selling", label: "Best Selling" },
  { value: "price-low", label: "Price: Low to High" }, { value: "price-high", label: "Price: High to Low" }, { value: "rating", label: "Customer Rating" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
export interface ShopQuery {
  search?: string; category: string[]; min?: number; max?: number;
  inStock: boolean; outOfStock: boolean; isNew: boolean; bestSeller: boolean; onSale: boolean; featured: boolean;
  sort: SortKey; view: "grid" | "list";
}
type SP = Record<string, string | string[] | undefined>;
const first = (v: SP[string]) => (Array.isArray(v) ? v[0] : v);
const flag = (v: SP[string]) => ["true", "1"].includes(first(v) ?? "");
const num = (v: SP[string]) => { const n = parseFloat(first(v) ?? ""); return Number.isFinite(n) && n >= 0 ? n : undefined; };
/** URL -> query. Same function runs on the server (pages) and client (filter UI). */
export function parseQuery(sp: SP): ShopQuery {
  const sort = first(sp.sort) as SortKey;
  return {
    search: first(sp.search)?.trim() || undefined,
    category: (first(sp.category) ?? "").split(",").filter(Boolean),
    min: num(sp.min), max: num(sp.max),
    inStock: flag(sp.instock), outOfStock: flag(sp.outofstock),
    isNew: flag(sp.new), bestSeller: flag(sp.bestseller), onSale: flag(sp.sale), featured: flag(sp.featured),
    sort: SORT_OPTIONS.some(o => o.value === sort) ? sort : "featured", view: first(sp.view) === "list" ? "list" : "grid",
  };
}
/** query -> URL params (defaults omitted). */
export function toParams(q: ShopQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.search) p.set("search", q.search);
  if (q.category.length) p.set("category", q.category.join(","));
  if (q.min !== undefined) p.set("min", String(q.min));
  if (q.max !== undefined) p.set("max", String(q.max));
  if (q.inStock) p.set("instock", "true"); if (q.outOfStock) p.set("outofstock", "true");
  if (q.isNew) p.set("new", "true"); if (q.bestSeller) p.set("bestseller", "true");
  if (q.onSale) p.set("sale", "true"); if (q.featured) p.set("featured", "true");
  if (q.sort !== "featured") p.set("sort", q.sort); if (q.view === "list") p.set("view", "list");
  return p;
}
export const activeFilterCount = (q: ShopQuery) =>
  q.category.length + (q.min !== undefined || q.max !== undefined ? 1 : 0) + [q.inStock, q.outOfStock, q.isNew, q.bestSeller, q.onSale, q.featured].filter(Boolean).length;
export interface ShopLock { category?: string; special?: "new" | "sale" }

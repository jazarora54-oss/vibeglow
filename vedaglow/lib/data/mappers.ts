import type { Product } from "@/types";
const u = <T,>(v: T | null | undefined) => v ?? undefined;
const DEFAULT_VISUAL: Product["visual"] = { kind: "bottle", label: "", color: "#E9D2B4" };
/** Database row -> Product used by the whole storefront. */
export function rowToProduct(r: any): Product {
  return {
    id: r.id, slug: r.slug, name: r.name, brand: u(r.brand), short_description: r.short_description ?? "",
    description: u(r.description), ingredients: u(r.ingredients), benefits: u(r.benefits), how_to_use: u(r.how_to_use), size_quantity: u(r.size_quantity),
    shipping_info: u(r.shipping_info), return_info: u(r.return_info), suitable_for: u(r.suitable_for), sku: u(r.sku), product_type: u(r.product_type), size: u(r.size),
    category: r.category, price: Number(r.price), compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : undefined,
    rating: Number(r.rating ?? 0), review_count: r.review_count ?? 0, images: r.images ?? [], visual: r.visual ?? DEFAULT_VISUAL,
    tags: r.tags ?? [], variants: Array.isArray(r.variants) && r.variants.length ? r.variants : undefined, stock: r.stock ?? 0, created_at: r.created_at,
  };
}
export type ProductInput = Omit<Product, "created_at" | "rating" | "review_count"> & { is_active: boolean };
const blank = (v?: string) => (v && v.trim() ? v.trim() : null);
/** Admin form -> database row. */
export function productToRow(p: ProductInput) {
  const variants = (p.variants ?? []).map(v => ({ ...v, price: Number(v.price), stock: Math.max(0, Math.floor(Number(v.stock) || 0)), compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : undefined }));
  return {
    id: p.id, slug: p.slug.trim(), name: p.name.trim(), brand: blank(p.brand), short_description: p.short_description?.trim() ?? "",
    description: blank(p.description), ingredients: blank(p.ingredients), benefits: blank(p.benefits), how_to_use: blank(p.how_to_use), size_quantity: blank(p.size_quantity),
    shipping_info: blank(p.shipping_info), return_info: blank(p.return_info), suitable_for: blank(p.suitable_for), sku: blank(p.sku), product_type: blank(p.product_type), size: blank(p.size),
    category: p.category, price: Number(p.price), compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    images: p.images, visual: p.visual, tags: p.tags, variants,
    stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : Math.max(0, Math.floor(Number(p.stock) || 0)),
    is_active: p.is_active, updated_at: new Date().toISOString(),
  };
}
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

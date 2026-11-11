import type { Product } from "@/types";
import { asMode } from "@/lib/shipping/rules";
const u = <T,>(v: T | null | undefined) => v ?? undefined;
const n = (v: unknown) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const nn = (v: unknown, min = 0) => { const x = Number(v); return v != null && v !== "" && Number.isFinite(x) && x >= min ? Math.round(x * 100) / 100 : null; };
const DEFAULT_VISUAL: Product["visual"] = { kind: "bottle", label: "", color: "#E9D2B4" };
export function cleanFaqs(v: unknown): { q: string; a: string }[] | undefined {
  if (!Array.isArray(v)) return undefined; const out = v.map((x: any) => ({ q: String(x?.q ?? "").replace(/\s+/g, " ").trim().slice(0, 200), a: String(x?.a ?? "").replace(/\s+/g, " ").trim().slice(0, 600) })).filter(f => f.q && f.a).slice(0, 8); return out.length ? out : undefined;
}
/** Database row -> Product used by the whole storefront. */
export function rowToProduct(r: any): Product {
  return {
    id: r.id, slug: r.slug, name: r.name, brand: u(r.brand), short_description: r.short_description ?? "",
    description: u(r.description), ingredients: u(r.ingredients), benefits: u(r.benefits), how_to_use: u(r.how_to_use), size_quantity: u(r.size_quantity),
    shipping_info: u(r.shipping_info), return_info: u(r.return_info), suitable_for: u(r.suitable_for), sku: u(r.sku), product_type: u(r.product_type), size: u(r.size),
    category: r.category, price: Number(r.price), compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : undefined,
    rating: Number(r.rating ?? 0), review_count: r.review_count ?? 0, images: r.images ?? [], visual: r.visual ?? DEFAULT_VISUAL,
    tags: r.tags ?? [], seo_title: u(r.seo_title), seo_description: u(r.seo_description), seo_keywords: u(r.seo_keywords), seo_noindex: r.seo_noindex === true ? true : undefined,
    specifics: Array.isArray(r.specifics) ? r.specifics : [], faqs: cleanFaqs(r.faqs), sort_priority: r.sort_priority ?? 0, gtin: u(r.gtin), mpn: u(r.mpn), condition: u(r.condition),
    weight_g: r.weight_g != null ? Number(r.weight_g) : undefined, dimensions: u(r.dimensions), country_of_origin: u(r.country_of_origin), shelf_life: u(r.shelf_life),
    shipping_mode: asMode(r.shipping_mode), shipping_flat_price: n(r.shipping_flat_price), shipping_extra_price: n(r.shipping_extra_price), handling_days: n(r.handling_days), pkg_length_in: n(r.pkg_length_in), pkg_width_in: n(r.pkg_width_in), pkg_height_in: n(r.pkg_height_in),
    variants: Array.isArray(r.variants) && r.variants.length ? r.variants : undefined, stock: r.stock ?? 0, created_at: r.created_at,
  };
}
export type ProductInput = Omit<Product, "created_at" | "rating" | "review_count"> & { is_active: boolean };
const blank = (v?: string) => (v && v.trim() ? v.trim() : null);
const trim = (t: string, n: number) => (t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…");
const CAT_NAMES: Record<string, string> = { "skin-care": "Skin Care", "hair-care": "Hair Care", "body-care": "Body Care", "health-wellness": "Health & Wellness", "oral-care": "Oral Care" };
/** SEO text is filled automatically when the admin leaves it empty. */
export function autoSeo(p: Pick<ProductInput, "name" | "brand" | "short_description" | "description" | "product_type" | "category"> & Partial<Pick<ProductInput, "specifics" | "size" | "size_quantity" | "suitable_for">>) {
  const sp = (n: string) => (p.specifics ?? []).find(x => x.name.trim().toLowerCase() === n.toLowerCase())?.value?.trim() || "";
  const size = (p.size || p.size_quantity || sp("Volume") || "").trim(); const lower = p.name.toLowerCase();
  const brandPart = p.brand && !lower.includes(p.brand.toLowerCase()) ? ` – ${p.brand}` : "";
  const sizePart = size && size.length <= 14 && !lower.includes(size.toLowerCase()) ? ` ${size}` : "";
  const title = trim(`${p.name}${sizePart}${brandPart} | VEDAGLOW`, 70);
  const base = (p.short_description || p.description || "").replace(/\s+/g, " ").trim();
  const extra = [sp("Features"), sp("Formulation"), p.suitable_for?.trim() || sp("Suitable For"), sp("Department")].filter(Boolean).join(", ");
  const description = trim(base ? `${p.name}: ${base}` : `Shop ${p.name}${sizePart} at VEDAGLOW${extra ? ". " + extra : ""}.`, 160);
  const dept = sp("Department"); const keywords = [...new Set([p.name, p.product_type, p.brand && p.product_type ? `${p.brand} ${p.product_type}` : "", sp("Type"), sp("Color"), sp("Hair Color Shade"), sp("Formulation"), sizePart.trim(), dept && p.product_type ? `${p.product_type} for ${dept.toLowerCase()}` : "", (CAT_NAMES[p.category] ?? p.category.replace(/-/g, " ")), p.brand, "VEDAGLOW"].map(x => (x ?? "").trim()).filter(Boolean))].slice(0, 12).join(", ");
  return { title, description, keywords };
}
/** Admin form -> database row. */
export function productToRow(p: ProductInput) {
  const seo = autoSeo(p);
  const variants = (p.variants ?? []).map(v => ({ ...v, price: Number(v.price), stock: Math.max(0, Math.floor(Number(v.stock) || 0)), compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : undefined }));
  return {
    id: p.id, slug: p.slug.trim(), name: p.name.trim(), brand: blank(p.brand), short_description: p.short_description?.trim() ?? "",
    description: blank(p.description), ingredients: blank(p.ingredients), benefits: blank(p.benefits), how_to_use: blank(p.how_to_use), size_quantity: blank(p.size_quantity),
    shipping_info: blank(p.shipping_info), return_info: blank(p.return_info), suitable_for: blank(p.suitable_for), sku: blank(p.sku), product_type: blank(p.product_type), size: blank(p.size),
    category: p.category, price: Number(p.price), compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    images: p.images, visual: p.visual, tags: p.tags, variants, ...(p.faqs !== undefined ? { faqs: cleanFaqs(p.faqs) ?? null } : {}),
    seo_title: blank(p.seo_title) ?? seo.title, seo_description: blank(p.seo_description) ?? seo.description, seo_keywords: blank(p.seo_keywords) ?? seo.keywords, ...(p.seo_noindex !== undefined ? { seo_noindex: !!p.seo_noindex } : {}),
    specifics: (p.specifics ?? []).map(x => ({ name: x.name.trim(), value: x.value.trim() })).filter(x => x.name && x.value),
    sort_priority: Math.max(0, Math.min(1000, Math.floor(Number(p.sort_priority) || 0))), gtin: blank(p.gtin), mpn: blank(p.mpn), condition: blank(p.condition) ?? "New",
    weight_g: p.weight_g ? Number(p.weight_g) : null,
    dimensions: blank(p.dimensions) ?? (p.pkg_length_in && p.pkg_width_in && p.pkg_height_in ? `${p.pkg_length_in} × ${p.pkg_width_in} × ${p.pkg_height_in} in` : null),
    shipping_mode: asMode(p.shipping_mode), shipping_flat_price: nn(p.shipping_flat_price), shipping_extra_price: nn(p.shipping_extra_price), handling_days: p.handling_days != null && Number.isFinite(Number(p.handling_days)) ? Math.max(0, Math.min(30, Math.floor(Number(p.handling_days)))) : null,
    pkg_length_in: nn(p.pkg_length_in, 0.1), pkg_width_in: nn(p.pkg_width_in, 0.1), pkg_height_in: nn(p.pkg_height_in, 0.1), country_of_origin: blank(p.country_of_origin), shelf_life: blank(p.shelf_life),
    stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : Math.max(0, Math.floor(Number(p.stock) || 0)),
    is_active: p.is_active, updated_at: new Date().toISOString(),
  };
}
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

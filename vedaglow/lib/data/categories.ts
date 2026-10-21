import type { Category, StoreCategory } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
import { getProducts } from "@/lib/data/products";
/** The five original categories. Used until you save categories in admin -> Categories. */
export const DEFAULT_CATEGORIES: StoreCategory[] = [
  { id: "d1", slug: "skin-care", name: "Skin Care", blurb: "Explore our collection of skin care products.", sort_order: 10, is_active: true },
  { id: "d2", slug: "hair-care", name: "Hair Care", blurb: "Explore our collection of hair care products.", sort_order: 20, is_active: true },
  { id: "d3", slug: "body-care", name: "Body Care", blurb: "Explore our collection of body care products.", sort_order: 30, is_active: true },
  { id: "d4", slug: "health-wellness", name: "Health & Wellness", blurb: "Explore our collection of health and wellness products.", sort_order: 40, is_active: true },
  { id: "d5", slug: "oral-care", name: "Oral Care", blurb: "Explore our collection of oral care products.", sort_order: 50, is_active: true },
];
const TONES = ["#F3DCCB", "#E9D2B4", "#F1E3B8", "#D9E6D2", "#D6E6EE", "#E6D9EC", "#EBD5D5"];
export const rowToCategory = (r: any): StoreCategory => ({ id: String(r.id), slug: String(r.slug), name: String(r.name ?? ""), blurb: String(r.blurb ?? ""), image_url: r.image_url ?? undefined, sort_order: Number(r.sort_order) || 0, is_active: r.is_active !== false, seo_title: r.seo_title ?? undefined, seo_description: r.seo_description ?? undefined, saved: true });
/** Active categories from the database (falls back to the built-in five until the table has rows). */
async function loadActive(): Promise<StoreCategory[]> {
  if (!isSupabaseConfigured) return DEFAULT_CATEGORIES;
  try {
    const { data, error } = await publicClient().from("categories").select("*").eq("is_active", true).order("sort_order").order("name");
    if (error || !data || data.length === 0) return DEFAULT_CATEGORIES;
    return data.map(rowToCategory);
  } catch { return DEFAULT_CATEGORIES; }
}
/** One category by its URL slug (also inactive ones are NOT returned: they are switched off). */
export async function getCategoryBySlug(slug: string): Promise<StoreCategory | undefined> { return (await loadActive()).find(c => c.slug === slug); }
/** Categories to show in the menu, filters, footer and homepage: active AND with at least one product in them. */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  const [cats, products] = await Promise.all([loadActive(), getProducts()]);
  const used = new Set(products.map(p => p.category));
  return cats.filter(c => used.has(c.slug));
}
/** Homepage "shop by category" tiles. */
export async function getCategories(): Promise<Category[]> {
  const cats = await getStoreCategories();
  return [...cats.map((c, i): Category => ({ id: c.id, slug: c.slug, name: c.name, image_url: c.image_url, href: `/category/${c.slug}`, tone: TONES[i % TONES.length] })),
    { id: "n1", slug: "new-arrivals", name: "New Arrivals", href: "/new-arrivals", tone: "#DDE8CF" }, { id: "n2", slug: "sale", name: "Sale", href: "/sale", tone: "#F4D2CC" }];
}

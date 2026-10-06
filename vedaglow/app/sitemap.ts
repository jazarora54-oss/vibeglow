import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getProducts } from "@/lib/data/products";
import { CATEGORY_OPTIONS } from "@/lib/shop";
import { PAGE_SLUGS } from "@/lib/data/defaults";
export const dynamic = "force-dynamic";
/** Lists every page and product so Google can find them. Updates by itself when you add products in /admin. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl(); const products = await getProducts();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/new-arrivals`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/sale`, changeFrequency: "daily", priority: 0.7 },
    ...CATEGORY_OPTIONS.map(c => ({ url: `${base}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...PAGE_SLUGS.map(s => ({ url: `${base}/${s}`, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...products.map(p => ({ url: `${base}/product/${p.slug}`, lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

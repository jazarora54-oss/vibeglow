import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/cart", "/checkout", "/order-confirmation", "/account", "/wishlist", "/track-order", "/unsubscribe"] }], sitemap: `${siteUrl()}/sitemap.xml` };
}

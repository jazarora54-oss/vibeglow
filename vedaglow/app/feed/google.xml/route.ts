import { siteUrl } from "@/lib/site";
import { getProducts } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/site";
import { feedItems, feedXml } from "@/lib/seo";
export const dynamic = "force-dynamic";
/** Product feed for Google Merchant Center (free listings). Always up to date with admin -> Products. */
export async function GET() {
  const [products, s] = await Promise.all([getProducts(), getSiteSettings()]); const base = siteUrl(); const store = s.store_name || "VEDAGLOW";
  return new Response(feedXml(feedItems(products, base, store), base, store), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=900" } });
}

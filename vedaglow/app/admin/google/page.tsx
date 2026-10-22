import GoogleForm from "@/components/admin/GoogleForm";
import { getSiteSettings } from "@/lib/data/site";
import { siteUrl } from "@/lib/site";
import { getProducts } from "@/lib/data/products";
import { feedItems } from "@/lib/seo";
export default async function Page() {
  const [s, products] = await Promise.all([getSiteSettings(), getProducts()]); const base = siteUrl();
  const sent = feedItems(products, base, s.store_name).length;
  const skipped = products.filter(p => p.seo_noindex || !(p.price > 0) || !p.images[0]).map(p => p.name);
  return <div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Google &amp; Analytics</h1>
    <p className="text-sm text-ink/60">Connect Google Analytics (visitor numbers), Google Search Console (get found on Google) and the free product feed for Google Shopping.</p>
    <GoogleForm initial={{ ga_id: s.ga_id, google_verify: s.google_verify }} base={base} feedCount={sent} skipped={skipped} /></div>;
}

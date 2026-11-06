import GoogleForm from "@/components/admin/GoogleForm";
import { getSiteSettings } from "@/lib/data/site";
import { siteUrl } from "@/lib/site";
import { getProducts } from "@/lib/data/products";
import { feedItems } from "@/lib/seo";
export default async function Page() {
  const [s, products] = await Promise.all([getSiteSettings(), getProducts()]); const base = siteUrl();
  const sent = feedItems(products, base, s.store_name).length;
  const skipped = products.filter(p => p.seo_noindex || !(p.price > 0) || !p.images[0]).map(p => p.name);
  const issues = products.map(p => ({ name: p.name, slug: p.slug, id: p.id, problems: [!p.images[0] && "no photo", !(p.seo_description || p.short_description) && "no description", (p.seo_description ?? "").length > 160 && "SEO description over 160 characters", p.seo_noindex && "hidden from Google", !(p.price > 0) && "no price"].filter(Boolean) as string[] })).filter(x => x.problems.length);
  return <div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Google &amp; Analytics</h1>
    <p className="text-sm text-ink/60">Connect Google Analytics (visitor numbers), Google Search Console (get found on Google) and the free product feed for Google Shopping.</p>
    <GoogleForm initial={{ ga_id: s.ga_id, google_verify: s.google_verify, meta_pixel_id: s.meta_pixel_id ?? "" }} base={base} feedCount={sent} skipped={skipped} />
    <section className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Product SEO check</h2>
      {issues.length === 0 ? <p className="text-sm text-green-800">All {products.length} products have a photo, description and price, and are visible to Google.</p> : <><p className="mb-2 text-sm text-ink/60">{issues.length} of {products.length} products need attention:</p><ul className="divide-y divide-forest/10 text-sm">{issues.map(x => <li key={x.id} className="py-2"><a href={`/admin/products/${x.id}`} className="font-semibold text-forest underline">{x.name}</a> <span className="text-ink/60">— {x.problems.join(", ")}</span></li>)}</ul></>}</section></div>;
}

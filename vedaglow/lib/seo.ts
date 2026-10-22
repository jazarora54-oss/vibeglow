import type { Product } from "@/types";
import type { SiteSettings } from "@/lib/data/defaults";
/** SEO / Google helpers. Pure functions (no database) so the website, the product feed and the tests share them. */
export const GA_RE = /^G-[A-Z0-9]{6,14}$/;
export const gaId = (x: unknown) => { const t = String(x ?? "").trim().toUpperCase(); return GA_RE.test(t) ? t : ""; };
/** Search Console "HTML tag" token: letters, digits, - and _ only (never anything that could break out of a meta tag). */
export const verifyToken = (x: unknown) => { const t = String(x ?? "").trim(); const m = t.match(/content="([^"]+)"/); const v = (m ? m[1] : t); return /^[A-Za-z0-9_-]{20,100}$/.test(v) ? v : ""; };
const abs = (base: string, u: string) => /^https?:\/\//i.test(u) ? u : base + (u.startsWith("/") ? u : "/" + u);

export function organizationLd(s: SiteSettings, base: string) {
  const sameAs = [s.instagram, s.facebook, s.tiktok, s.youtube].map(x => String(x ?? "").trim()).filter(x => /^https:\/\//i.test(x));
  return { "@context": "https://schema.org", "@type": "Organization", name: s.store_name || "VEDAGLOW", url: base, logo: s.logo_url ? abs(base, s.logo_url) : `${base}/logo.png`,
    ...(s.email ? { email: s.email } : {}), ...(s.phone ? { telephone: s.phone } : {}), ...(sameAs.length ? { sameAs } : {}) };
}
export const websiteLd = (s: SiteSettings, base: string) => ({ "@context": "https://schema.org", "@type": "WebSite", name: s.store_name || "VEDAGLOW", url: base,
  potentialAction: { "@type": "SearchAction", target: `${base}/shop?q={search_term_string}`, "query-input": "required name=search_term_string" } });
export function breadcrumbLd(base: string, items: { name: string; path?: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, ...(x.path ? { item: base + x.path } : {}) })) };
}
/** JSON for a <script type="application/ld+json"> tag: "<" is escaped so text can never close the tag. */
export const ldJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

// ---------- Google Merchant Center product feed (RSS 2.0 with g: tags) ----------
export const xmlEsc = (x: unknown) => String(x ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const plain = (x: unknown, n: number) => String(x ?? "").replace(/<[^>]*>/g, " ").replace(/[*_#`>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const line = (x: unknown, n: number) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const usd = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2)} USD`;
export interface FeedItem { id: string; group?: string; title: string; description: string; link: string; image: string; extra: string[]; availability: string; price: string; sale?: string; brand: string; gtin?: string; mpn?: string; weight?: string; type?: string }
/** Products that may go to Google: shown on the site (not "hide from Google"), with a price and a picture. A product with sizes becomes one item per size. */
export function feedItems(products: Product[], base: string, store: string): FeedItem[] {
  const out: FeedItem[] = [];
  for (const p of products) {
    if (p.seo_noindex || !(p.price > 0) || !p.images[0]) continue;
    const link = `${base}/product/${p.slug}`, desc = plain(p.description || p.short_description || p.name, 5000), brand = (p.brand || store || "VEDAGLOW").trim();
    const common = { title: line(p.name, 150), description: desc || line(p.name, 150), link, image: abs(base, p.images[0]), extra: p.images.slice(1, 11).map(u => abs(base, u)), brand, gtin: p.gtin?.trim() || undefined, mpn: p.mpn?.trim() || undefined,
      weight: p.weight_g && p.weight_g > 0 ? `${Math.round(p.weight_g)} g` : undefined, type: plain(p.product_type || p.category, 150) || undefined };
    const vs = (p.variants ?? []).filter(v => v.price > 0);
    const sets = vs.length ? vs.map(v => ({ id: v.sku || `${p.id}-${v.id}`, group: p.id, label: v.label, price: v.price, was: v.compare_at_price, stock: v.stock, link: `${link}` })) : [{ id: p.sku || p.id, group: undefined as string | undefined, label: "", price: p.price, was: p.compare_at_price, stock: p.stock, link }];
    for (const s of sets) {
      const onSale = !!s.was && s.was > s.price;
      out.push({ ...common, id: String(s.id).slice(0, 50), group: s.group, title: line(s.label ? `${p.name} - ${s.label}` : p.name, 150), link: s.link, availability: s.stock > 0 ? "in_stock" : "out_of_stock", price: usd(onSale ? s.was! : s.price), sale: onSale ? usd(s.price) : undefined });
    }
  }
  return out;
}
export function feedXml(items: FeedItem[], base: string, store: string): string {
  const t = (tag: string, v?: string) => v ? `<g:${tag}>${xmlEsc(v)}</g:${tag}>` : "";
  const body = items.map(i => `<item>${t("id", i.id)}${t("item_group_id", i.group)}<title>${xmlEsc(i.title)}</title><description>${xmlEsc(i.description)}</description><link>${xmlEsc(i.link)}</link>${t("image_link", i.image)}${i.extra.map(u => t("additional_image_link", u)).join("")}${t("availability", i.availability)}${t("price", i.price)}${t("sale_price", i.sale)}${t("brand", i.brand)}${t("condition", "new")}${i.gtin ? t("gtin", i.gtin) : ""}${i.mpn ? t("mpn", i.mpn) : ""}${!i.gtin && !i.mpn ? t("identifier_exists", "no") : ""}${t("shipping_weight", i.weight)}${t("product_type", i.type)}</item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${xmlEsc(store)}</title><link>${xmlEsc(base)}</link><description>${xmlEsc(store)} products</description>${body}</channel></rss>`;
}

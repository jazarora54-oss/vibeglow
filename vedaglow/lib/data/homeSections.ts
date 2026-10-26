import type { SiteSettings } from "@/lib/data/defaults";
/** The blocks of the homepage, in their built-in order. admin -> Homepage can reorder, hide and (for product rows) rename them. */
export interface HomeSectionMeta { key: string; label: string; help: string; titled?: string; /** how many products it shows by default (product rows only) */ count?: number }
export const COUNT_CHOICES = [4, 8, 12, 16, 20];
export const HOME_SECTIONS: HomeSectionMeta[] = [
  { key: "banners", label: "Top banner", help: "Your sliding banners (admin -> Banners). With no live banner the original hero picture is shown." },
  { key: "categories", label: "Shop by category", help: "Round category pictures." },
  { key: "best", count: 8, label: "Best sellers", help: "Products tagged Best seller.", titled: "Best Sellers" },
  { key: "new", count: 8, label: "New arrivals", help: "Products tagged New.", titled: "New Arrivals" },
  { key: "sale", count: 8, label: "On sale", help: "Products tagged Sale.", titled: "On Sale" },
  { key: "featured", count: 8, label: "Featured products", help: "Products tagged Featured.", titled: "Featured Products" },
  { key: "related", count: 4, label: "You may also like", help: "A few products similar to the best sellers.", titled: "You May Also Like" },
  { key: "service", label: "Trust icons strip", help: "Free shipping, secure checkout, support icons." },
  { key: "newsletter", label: "Newsletter sign-up", help: "Email sign-up box (text is edited in Popup & Top bar)." },
];
export interface HomeSection { key: string; on: boolean; title?: string; count?: number }
const cleanCount = (x: unknown, key: string) => { const n = Math.floor(Number(x)); const d = HOME_SECTIONS.find(m => m.key === key)?.count; return d && Number.isFinite(n) && n >= 1 ? Math.min(n, 24) : undefined; };
/** How many products a row shows. */
export const countOf = (rows: HomeSection[], key: string) => rows.find(r => r.key === key)?.count ?? HOME_SECTIONS.find(m => m.key === key)?.count ?? 4;
/** The saved order, cleaned up: unknown keys dropped, duplicates removed, and any section that is missing is added at the end (switched on). Never throws. */
export function homeSectionsOf(s: Pick<SiteSettings, "home_sections"> | undefined | null): HomeSection[] {
  const known = new Set(HOME_SECTIONS.map(m => m.key)); const seen = new Set<string>(); const out: HomeSection[] = [];
  const saved = (Array.isArray(s?.home_sections) ? s!.home_sections : []) as HomeSection[];
  for (const r of saved) { if (!r || !known.has(r.key) || seen.has(r.key)) continue; seen.add(r.key); const title = typeof r.title === "string" ? r.title.trim().slice(0, 60) : ""; const count = cleanCount((r as HomeSection).count, r.key); out.push({ key: r.key, on: r.on !== false, ...(title ? { title } : {}), ...(count ? { count } : {}) }); }
  for (const m of HOME_SECTIONS) if (!seen.has(m.key)) out.push({ key: m.key, on: true });
  return out;
}

import type { SiteSettings } from "@/lib/data/defaults";
/** The blocks of the homepage, in their built-in order. admin -> Homepage can reorder, hide and (for product rows) rename them. */
export interface HomeSectionMeta { key: string; label: string; help: string; titled?: string }
export const HOME_SECTIONS: HomeSectionMeta[] = [
  { key: "banners", label: "Top banner", help: "Your sliding banners (admin -> Banners). With no live banner the original hero picture is shown." },
  { key: "categories", label: "Shop by category", help: "Round category pictures." },
  { key: "best", label: "Best sellers", help: "Products tagged Best seller.", titled: "Best Sellers" },
  { key: "new", label: "New arrivals", help: "Products tagged New.", titled: "New Arrivals" },
  { key: "sale", label: "On sale", help: "Products tagged Sale.", titled: "On Sale" },
  { key: "featured", label: "Featured products", help: "Products tagged Featured.", titled: "Featured Products" },
  { key: "related", label: "You may also like", help: "A few products similar to the best sellers.", titled: "You May Also Like" },
  { key: "service", label: "Trust icons strip", help: "Free shipping, secure checkout, support icons." },
  { key: "newsletter", label: "Newsletter sign-up", help: "Email sign-up box (text is edited in Popup & Top bar)." },
];
export interface HomeSection { key: string; on: boolean; title?: string }
/** The saved order, cleaned up: unknown keys dropped, duplicates removed, and any section that is missing is added at the end (switched on). Never throws. */
export function homeSectionsOf(s: Pick<SiteSettings, "home_sections"> | undefined | null): HomeSection[] {
  const known = new Set(HOME_SECTIONS.map(m => m.key)); const seen = new Set<string>(); const out: HomeSection[] = [];
  const saved = Array.isArray(s?.home_sections) ? s!.home_sections : [];
  for (const r of saved) { if (!r || !known.has(r.key) || seen.has(r.key)) continue; seen.add(r.key); const title = typeof r.title === "string" ? r.title.trim().slice(0, 60) : ""; out.push({ key: r.key, on: r.on !== false, ...(title ? { title } : {}) }); }
  for (const m of HOME_SECTIONS) if (!seen.has(m.key)) out.push({ key: m.key, on: true });
  return out;
}

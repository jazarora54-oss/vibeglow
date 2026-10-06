import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
import { DEFAULT_FAQS, DEFAULT_PAGES, DEFAULT_SETTINGS, type Faq, type PageSlug, type SiteSettings } from "./defaults";

/** Store contact info + social links (admin -> Settings). */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  try {
    const { data } = await publicClient().from("site_settings").select("data").eq("id", 1).maybeSingle();
    return { ...DEFAULT_SETTINGS, ...((data?.data as Partial<SiteSettings>) ?? {}) };
  } catch { return DEFAULT_SETTINGS; }
}
/** Page text: the admin's edited version if it exists, otherwise the built-in draft. */
export async function getPage(slug: PageSlug): Promise<{ title: string; body: string; custom: boolean }> {
  const d = DEFAULT_PAGES[slug];
  if (!isSupabaseConfigured) return { ...d, custom: false };
  try {
    const { data } = await publicClient().from("pages").select("title,body").eq("slug", slug).maybeSingle();
    return data ? { title: data.title || d.title, body: data.body, custom: true } : { ...d, custom: false };
  } catch { return { ...d, custom: false }; }
}
export async function getFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured) return DEFAULT_FAQS;
  try {
    const { data, error } = await publicClient().from("faqs").select("*").eq("is_active", true).order("sort_order").order("question");
    if (error || !data) return DEFAULT_FAQS;
    return data.length ? (data as Faq[]) : DEFAULT_FAQS; // nothing saved yet -> show the defaults
  } catch { return DEFAULT_FAQS; }
}

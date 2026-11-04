import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
import { serviceClient } from "@/lib/supabase/server";
import { DEFAULT_FAQS, DEFAULT_PAGES, DEFAULT_SETTINGS, type Faq, type PageSlug, type SiteSettings } from "./defaults";

/** The private "ship from" address fields. They must NEVER be sent to the browser or stored in the public settings row. */
export const PRIVATE_SETTING_KEYS = ["ship_name", "ship_company", "ship_street1", "ship_street2", "ship_city", "ship_state", "ship_zip", "ship_phone"] as const;
const stripPrivate = (s: SiteSettings): SiteSettings => { const o = { ...s } as Record<string, unknown>; for (const k of PRIVATE_SETTING_KEYS) o[k] = ""; return o as unknown as SiteSettings; };
/** Store contact info + social links (admin -> Settings). PUBLIC-SAFE: the private shipping address is always blanked here. */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return stripPrivate(DEFAULT_SETTINGS);
  try {
    const { data } = await publicClient().from("site_settings").select("data").eq("id", 1).maybeSingle();
    return stripPrivate({ ...DEFAULT_SETTINGS, ...((data?.data as Partial<SiteSettings>) ?? {}) });
  } catch { return stripPrivate(DEFAULT_SETTINGS); }
}
/** SERVER ONLY (admin pages, shipping labels, rate quotes): public settings + the private ship-from address.
 *  Reads the private table first; before migration 9 has been run it falls back to the old location so nothing breaks. */
export async function getSettingsWithPrivate(): Promise<SiteSettings> {
  const pub = await getSiteSettings();
  if (!isSupabaseConfigured) return pub;
  try {
    const sb = serviceClient(); if (!sb) return pub;
    const { data: priv, error } = await sb.from("private_settings").select("data").eq("id", 1).maybeSingle();
    let src = (!error && priv?.data ? priv.data : null) as Record<string, unknown> | null;
    if (!src) { const { data: old } = await sb.from("site_settings").select("data").eq("id", 1).maybeSingle(); src = (old?.data ?? null) as Record<string, unknown> | null; }
    const out = { ...pub } as Record<string, unknown>;
    for (const k of PRIVATE_SETTING_KEYS) if (src && typeof src[k] === "string") out[k] = src[k];
    return out as unknown as SiteSettings;
  } catch { return pub; }
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

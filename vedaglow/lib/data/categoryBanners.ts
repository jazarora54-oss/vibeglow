import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
export interface CategoryBanner { id: string; category_slug: string; version: number; status: "draft" | "published" | "archived"; desktop_image: string | null; mobile_image: string | null; heading: string; subtitle: string; button_text: string; button_link: string; image_alt: string; template: "upload" | "auto"; mood: string; ai_prompt: string; starts_at: string | null; ends_at: string | null; note: string; created_at: string; updated_at: string }
/** The live banner of ONE category (null = none, the page simply shows no banner). */
export async function getCategoryBanner(slug: string): Promise<CategoryBanner | null> {
  if (!isSupabaseConfigured || !/^[a-z0-9][a-z0-9-]{0,59}$/.test(slug)) return null;
  try {
    const { data } = await publicClient().from("category_banners").select("*").eq("category_slug", slug).eq("status", "published").maybeSingle();
    if (!data) return null; const now = Date.now();
    if ((data.starts_at && Date.parse(data.starts_at) > now) || (data.ends_at && Date.parse(data.ends_at) < now)) return null;
    return data as CategoryBanner;
  } catch { return null; }
}

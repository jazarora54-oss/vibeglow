import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
export interface Banner { id: string; title: string; subtitle: string; button_text: string; button_link: string; image_url: string; sort_order: number; is_active: boolean;
  /** optional schedule (dates), a separate image for phones, and a description of the picture for screen readers / Google */
  starts_at?: string | null; ends_at?: string | null; mobile_image_url?: string | null; image_alt?: string | null }
/** Is the banner switched on AND inside its start/end dates right now? */
export const bannerLive = (b: Pick<Banner, "is_active" | "starts_at" | "ends_at">, now = Date.now()) => Boolean(b.is_active)
  && (!b.starts_at || Date.parse(b.starts_at) <= now) && (!b.ends_at || Date.parse(b.ends_at) >= now);
/** Banners that are visible right now (admin -> Banners). Empty list = the homepage keeps its built-in hero. */
export async function getBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await publicClient().from("banners").select("*").eq("is_active", true).order("sort_order").order("created_at", { ascending: false });
    return error || !data ? [] : (data as Banner[]).filter(b => bannerLive(b));
  } catch { return []; }
}

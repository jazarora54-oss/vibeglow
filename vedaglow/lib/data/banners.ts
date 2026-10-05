import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
export interface Banner { id: string; title: string; subtitle: string; button_text: string; button_link: string; image_url: string; sort_order: number; is_active: boolean }
/** Active homepage banners (admin -> Banners). Empty list = the homepage keeps its built-in hero. */
export async function getBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await publicClient().from("banners").select("*").eq("is_active", true).order("sort_order").order("created_at", { ascending: false });
    return error || !data ? [] : (data as Banner[]);
  } catch { return []; }
}

import type { Deal } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
/** Database row -> Deal. */
export const rowToDeal = (r: any): Deal => ({ id: String(r.id), name: String(r.name ?? ""), kind: r.kind === "percent" ? "percent" : "buy_get", buy_qty: Number(r.buy_qty) || 1, get_qty: Number(r.get_qty) || 1, percent_off: Number(r.percent_off) || 0, product_ids: Array.isArray(r.product_ids) ? r.product_ids.map(String) : [], starts_at: r.starts_at ?? null, ends_at: r.ends_at ?? null });
/** Deals switched ON in admin -> Deals (the date window is checked where prices are worked out). Empty list if the table does not exist yet. */
export async function getActiveDeals(): Promise<Deal[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await publicClient().from("deals").select("*").eq("is_active", true).order("created_at");
    if (error || !data) return [];
    return data.map(rowToDeal);
  } catch { return []; }
}

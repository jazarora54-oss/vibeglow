import type { Post, Store } from "./queue";
import type { MetaCfg } from "./meta";
type Db = NonNullable<ReturnType<typeof import("@/lib/supabase/server").serviceClient>>;
export const supabaseStore = (db: Db): Store => ({
  async due(nowIso, limit) { const { data } = await db.from("social_posts").select("id,product_id,platform,status,caption,image_url,scheduled_at,attempts").eq("status", "queued").or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`).order("scheduled_at", { ascending: true, nullsFirst: true }).limit(limit); return (data ?? []) as Post[]; },
  async claim(id) { const { data } = await db.from("social_posts").update({ status: "posting", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "queued").select("id"); return (data ?? []).length === 1; },
  async finish(id, patch) { await db.from("social_posts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id); },
  async postedSince(iso) { const { count } = await db.from("social_posts").select("id", { count: "exact", head: true }).eq("status", "posted").gte("posted_at", iso); return count ?? 0; },
});
export async function loadCfg(db: Db): Promise<MetaCfg | null> {
  const { data } = await db.from("social_tokens").select("page_id,page_token,ig_user_id").eq("id", 1).maybeSingle(); if (!data?.page_id || !data?.page_token) return null;
  return { pageId: data.page_id, pageToken: data.page_token, igUserId: data.ig_user_id || undefined };
}

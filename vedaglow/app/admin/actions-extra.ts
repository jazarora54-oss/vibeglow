"use server";
import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { getSiteSettings } from "@/lib/data/site";
import type { SiteSettings } from "@/lib/data/defaults";
type Res = { ok: boolean; message?: string };
/** Same rule as every admin action: signed in AND listed in `admins`. */
async function admin() {
  const sb = serverClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) throw new Error("Not signed in.");
  const { data } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(); if (!data) throw new Error("Not an admin."); return sb;
}
const fail = (e: unknown): Res => ({ ok: false, message: e instanceof Error ? e.message : "Something went wrong." });

/** Products list: delete all ticked products in one go (permanent). */
export async function deleteProducts(ids: string[]): Promise<Res & { deleted?: number }> {
  try {
    const sb = await admin(); const list = [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))].slice(0, 200);
    if (!list.length) return { ok: false, message: "Tick at least one product first." };
    const { error } = await sb.from("products").delete().in("id", list); if (error) return { ok: false, message: error.message };
    await audit(sb, "product.delete", `Bulk delete: ${list.length} products (${list.join(", ")})`.slice(0, 400)); revalidatePath("/", "layout"); revalidatePath("/admin/products");
    return { ok: true, deleted: list.length, message: `${list.length} product${list.length === 1 ? "" : "s"} deleted.` };
  } catch (e) { return fail(e); }
}

/** Category Design → Category buttons: sets (or clears) the picture of one round button on the homepage. */
export async function saveCategoryButton(slug: string, url: string | null): Promise<Res> {
  try {
    const sb = await admin(); if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(String(slug))) return { ok: false, message: "Unknown category." };
    const img = String(url ?? "").trim(); if (img && !/^https:\/\/\S+$/i.test(img)) return { ok: false, message: "The picture link is not valid." };
    const prev = await getSiteSettings(); const cur = { ...(((prev as unknown as { category_buttons?: Record<string, string> }).category_buttons) ?? {}) };
    if (img) cur[slug] = img; else delete cur[slug];
    const data = { ...prev, category_buttons: cur } as unknown as SiteSettings;
    const { error } = await sb.from("site_settings").upsert({ id: 1, data }, { onConflict: "id" }); if (error) return { ok: false, message: error.message };
    await audit(sb, "category.button", `${slug}: ${img ? "picture set" : "picture removed"}`); revalidatePath("/", "layout"); revalidatePath("/admin/category-design");
    return { ok: true, message: img ? "Category button picture saved. It is live on the homepage." : "Picture removed. The button shows the newest product photo again." };
  } catch (e) { return fail(e); }
}

import { serverClient } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "@/lib/data/categories";
/** Categories for the admin product form: switched-on ones from the database (or the built-in five until you save your own). */
export async function getAllCategoryOptions(): Promise<{ slug: string; name: string }[]> {
  try {
    const { data } = await serverClient().from("categories").select("slug,name,is_active").order("sort_order").order("name");
    const rows = (data ?? []).filter(c => c.is_active);
    return rows.length ? rows.map(c => ({ slug: c.slug, name: c.name })) : (data ?? []).length ? [] : DEFAULT_CATEGORIES.map(c => ({ slug: c.slug, name: c.name }));
  } catch { return DEFAULT_CATEGORIES.map(c => ({ slug: c.slug, name: c.name })); }
}

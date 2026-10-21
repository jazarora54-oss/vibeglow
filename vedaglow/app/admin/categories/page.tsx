import { serverClient } from "@/lib/supabase/server";
import CategoryManager from "@/components/admin/CategoryManager";
import { DEFAULT_CATEGORIES, rowToCategory } from "@/lib/data/categories";
export const dynamic = "force-dynamic";
export default async function Page() {
  const sb = serverClient();
  const [{ data, error }, { data: prods }] = await Promise.all([sb.from("categories").select("*").order("sort_order").order("name"), sb.from("products").select("category,is_active").limit(5000)]);
  const counts: Record<string, number> = {}; for (const p of prods ?? []) if (p.is_active) counts[p.category] = (counts[p.category] ?? 0) + 1;
  const saved = (data ?? []).map(rowToCategory);
  return <CategoryManager categories={saved} builtIn={saved.length === 0 ? DEFAULT_CATEGORIES : []} counts={counts} dbError={error?.message} />;
}

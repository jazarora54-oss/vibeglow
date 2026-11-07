import { serverClient, serviceClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/site";
import SocialManager, { type PostRow } from "@/components/admin/SocialManager";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product = "" } = await searchParams; const sb = serverClient(); const st = await getSiteSettings(); const svc = serviceClient();
  const [prods, posts, tok] = await Promise.all([sb.from("products").select("id,name,slug,price,short_description,category,images").eq("is_active", true).order("created_at", { ascending: false }).limit(1000), sb.from("social_posts").select("id,product_id,platform,status,caption,scheduled_at,attempts,last_error,permalink,created_at,posted_at,source").order("id", { ascending: false }).limit(150), svc ? svc.from("social_tokens").select("page_id,page_name,ig_user_id,ig_username,updated_at").eq("id", 1).maybeSingle() : Promise.resolve({ data: null })]);
  const missing = Boolean(posts.error && /social_posts/.test(posts.error.message));
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Social Media</h1>
    {missing && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Run <code>supabase/migration-16.sql</code> in the Supabase SQL Editor first.</p>}
    <SocialManager autoPost={Boolean(st.social_auto_post)} preselect={product} conn={tok.data ? { pageName: tok.data.page_name ?? tok.data.page_id, igUsername: tok.data.ig_username ?? "", hasIg: Boolean(tok.data.ig_user_id) } : null}
      products={(prods.data ?? []).map((p: any) => ({ id: p.id, name: p.name, slug: p.slug, price: Number(p.price), short: p.short_description ?? "", category: p.category ?? "", image: (p.images ?? [])[0] ?? "" }))} posts={(posts.data ?? []) as PostRow[]} /></div>);
}

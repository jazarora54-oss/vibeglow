import { serverClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/site";
import { aiConfig } from "@/lib/ai/provider";
import BannerStudio from "@/components/admin/BannerStudio";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [st, prods, n] = await Promise.all([getSiteSettings(), serverClient().from("products").select("id,name,slug,images,price").eq("is_active", true).order("created_at", { ascending: false }).limit(300), serverClient().from("banners").select("id", { count: "exact", head: true })]);
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Banner Studio</h1>
    <BannerStudio aiReady={Boolean(aiConfig())} autoUpload={Boolean(st.banner_auto_upload)} nextOrder={n.count ?? 0} products={(prods.data ?? []).map((p: any) => ({ id: p.id, name: p.name, slug: p.slug, image: (p.images ?? [])[0] ?? "", price: Number(p.price) }))} /></div>);
}

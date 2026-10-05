import { serverClient } from "@/lib/supabase/server";
import BannerManager from "@/components/admin/BannerManager";
import type { Banner } from "@/lib/data/banners";
export default async function Page() {
  const { data } = await serverClient().from("banners").select("*").order("sort_order").order("created_at", { ascending: false });
  return <BannerManager banners={(data ?? []) as Banner[]} />;
}

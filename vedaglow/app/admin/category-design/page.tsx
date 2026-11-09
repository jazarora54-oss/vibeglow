import { serverClient } from "@/lib/supabase/server";
import { getAllCategoryOptions } from "@/lib/data/categoriesAdmin";
import { aiConfig } from "@/lib/ai/provider";
import CategoryDesignManager from "@/components/admin/CategoryDesignManager";
import type { CategoryBanner } from "@/lib/data/categoryBanners";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [cats, { data, error }] = await Promise.all([getAllCategoryOptions(), serverClient().from("category_banners").select("*").order("category_slug").order("version", { ascending: false }).limit(1000)]);
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Category Design</h1>
    <p className="text-sm text-ink/70">Each category has its own banner for the computer and the phone. Upload your own pictures or let the studio design one from a photo. New categories appear here by themselves.</p>
    {error && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">The database needs a one-time update: open Supabase → SQL Editor and run supabase/migration-17.sql, then refresh this page.</p>}
    <CategoryDesignManager cats={cats} versions={(data ?? []) as CategoryBanner[]} aiReady={Boolean(aiConfig())} /></div>);
}

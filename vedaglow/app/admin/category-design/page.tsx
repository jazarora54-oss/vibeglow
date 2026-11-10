import { serverClient } from "@/lib/supabase/server";
import { getAllCategoryOptions } from "@/lib/data/categoriesAdmin";
import { getCategories } from "@/lib/data/categories";
import { getSiteSettings } from "@/lib/data/site";
import CategoryDesignManager from "@/components/admin/CategoryDesignManager";
import CategoryButtonManager, { type ButtonItem } from "@/components/admin/CategoryButtonManager";
import type { CategoryBanner } from "@/lib/data/categoryBanners";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [cats, { data, error }, buttons, st] = await Promise.all([getAllCategoryOptions(), serverClient().from("category_banners").select("*").order("category_slug").order("version", { ascending: false }).limit(1000), getCategories(), getSiteSettings()]);
  const saved = ((st as unknown as { category_buttons?: Record<string, string> }).category_buttons) ?? {};
  const items: ButtonItem[] = buttons.map(c => ({ slug: c.slug, name: c.name, image: saved[c.slug] || c.image_url || "", custom: Boolean(saved[c.slug]) }));
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Category Design</h1>
    <p className="text-sm text-ink/70">Two things per category: the <b>category button</b> (round picture on the homepage) and the <b>category banner</b> (wide picture on the category page, for the computer and the phone). Upload your own pictures. New categories appear here by themselves.</p>
    {error && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">The database needs a one-time update: open Supabase → SQL Editor and run supabase/migration-17.sql, then refresh this page.</p>}
    <CategoryButtonManager items={items} />
    <CategoryDesignManager cats={cats} versions={(data ?? []) as CategoryBanner[]} /></div>);
}

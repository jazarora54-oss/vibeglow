import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopPage from "@/components/shop/ShopPage";
import { getCategoryBySlug } from "@/lib/data/categories";
export const dynamic = "force-dynamic";
type Props = { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug); if (!cat) return { title: "Category not found | VEDAGLOW" };
  const title = cat.seo_title?.trim() || `${cat.name} | VEDAGLOW`, description = cat.seo_description?.trim() || cat.blurb || `Shop ${cat.name} at VEDAGLOW.`;
  return { title, description, alternates: { canonical: `/category/${cat.slug}` }, openGraph: { title, description, type: "website", url: `/category/${cat.slug}`, images: cat.image_url ? [{ url: cat.image_url }] : undefined } };
}
export default async function Page({ params, searchParams }: Props) {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();
  return <ShopPage title={cat.name} subtitle={cat.blurb || `Explore our ${cat.name.toLowerCase()} products.`} path={`/category/${cat.slug}`} crumbs={[{ label: "Shop", href: "/shop" }, { label: cat.name }]} searchParams={searchParams} lock={{ category: cat.slug }} />;
}

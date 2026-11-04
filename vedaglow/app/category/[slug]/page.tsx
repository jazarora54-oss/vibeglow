import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopPage from "@/components/shop/ShopPage";
import { getCategoryBySlug } from "@/lib/data/categories";
import { siteUrl } from "@/lib/site";
import { breadcrumbLd, ldJson } from "@/lib/seo";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const cat = await getCategoryBySlug(params.slug); if (!cat) return { title: "Category not found | VEDAGLOW" };
  const title = cat.seo_title?.trim() || `${cat.name} | VEDAGLOW`, description = cat.seo_description?.trim() || cat.blurb || `Shop ${cat.name} at VEDAGLOW.`;
  return { title, description, alternates: { canonical: `/category/${cat.slug}` }, openGraph: { title, description, type: "website", url: `/category/${cat.slug}`, images: cat.image_url ? [{ url: cat.image_url }] : undefined } };
}
export default async function Page(props: Props) {
  const params = await props.params; const searchParams = await props.searchParams;
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd(siteUrl(), [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: cat.name }])) }} /><ShopPage title={cat.name} subtitle={cat.blurb || `Explore our ${cat.name.toLowerCase()} products.`} path={`/category/${cat.slug}`} crumbs={[{ label: "Shop", href: "/shop" }, { label: cat.name }]} searchParams={searchParams} lock={{ category: cat.slug }} /></>;
}

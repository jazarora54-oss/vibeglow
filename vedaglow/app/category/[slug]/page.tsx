import { notFound } from "next/navigation";
import ShopPage from "@/components/shop/ShopPage";
import { CATEGORY_OPTIONS } from "@/lib/shop";
export function generateStaticParams() { return CATEGORY_OPTIONS.map(c => ({ slug: c.slug })); }
export default function Page({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const cat = CATEGORY_OPTIONS.find(c => c.slug === params.slug);
  if (!cat) notFound();
  return <ShopPage title={cat.name} subtitle={cat.blurb} path={`/category/${cat.slug}`} crumbs={[{ label: "Shop", href: "/shop" }, { label: cat.name }]} searchParams={searchParams} lock={{ category: cat.slug }} />;
}

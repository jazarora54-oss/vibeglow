import ShopPage from "@/components/shop/ShopPage";
export const metadata = { title: "Shop All | VEDAGLOW" };
export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <ShopPage title="Shop All" subtitle="Discover beauty, personal care and wellness products for your everyday routine." path="/shop" crumbs={[{ label: "Shop" }]} searchParams={searchParams} />;
}

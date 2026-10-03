import ShopPage from "@/components/shop/ShopPage";
export const metadata = { title: "New Arrivals | VEDAGLOW" };
export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <ShopPage title="New Arrivals" subtitle="Discover what's new at VEDAGLOW." path="/new-arrivals" crumbs={[{ label: "New Arrivals" }]} searchParams={searchParams} lock={{ special: "new" }} />;
}

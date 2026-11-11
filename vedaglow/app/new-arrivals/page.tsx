import ShopPage from "@/components/shop/ShopPage";
export const metadata = { title: "New Arrivals | VEDAGLOW" };
export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  return <ShopPage title="New Arrivals" subtitle="Discover what's new at VEDAGLOW." path="/new-arrivals" crumbs={[{ label: "New Arrivals" }]} searchParams={{ sort: "newest", ...searchParams }} lock={{ special: "new" }} />;
}

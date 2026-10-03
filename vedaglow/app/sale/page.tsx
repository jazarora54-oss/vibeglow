import ShopPage from "@/components/shop/ShopPage";
export const metadata = { title: "Sale | VEDAGLOW" };
export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <ShopPage title="Sale" subtitle="Enjoy special prices on selected VEDAGLOW products." path="/sale" crumbs={[{ label: "Sale" }]} searchParams={searchParams} lock={{ special: "sale" }} />;
}

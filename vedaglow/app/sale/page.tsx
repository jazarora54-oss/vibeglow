import ShopPage from "@/components/shop/ShopPage";
export const metadata = { title: "Sale | VEDAGLOW" };
export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  return <ShopPage title="Sale" subtitle="Enjoy special prices on selected VEDAGLOW products." path="/sale" crumbs={[{ label: "Sale" }]} searchParams={searchParams} lock={{ special: "sale" }} />;
}

import { serverClient } from "@/lib/supabase/server";
import DealManager, { type DealRow } from "@/components/admin/DealManager";
export default async function Page() {
  const sb = serverClient();
  const [{ data: deals, error }, { data: prods }] = await Promise.all([sb.from("deals").select("*").order("created_at", { ascending: false }), sb.from("products").select("id,name").eq("is_active", true).order("name")]);
  return <DealManager deals={(deals ?? []) as DealRow[]} products={(prods ?? []) as { id: string; name: string }[]} dbError={error?.message} />;
}

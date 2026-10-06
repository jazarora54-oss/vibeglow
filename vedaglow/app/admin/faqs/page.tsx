import { serverClient } from "@/lib/supabase/server";
import FaqManager, { type FaqRow } from "@/components/admin/FaqManager";
export default async function Page() {
  const { data } = await serverClient().from("faqs").select("*").order("sort_order").order("question");
  return <FaqManager faqs={(data ?? []) as FaqRow[]} />;
}

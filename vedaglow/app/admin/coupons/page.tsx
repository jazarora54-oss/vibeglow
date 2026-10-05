import { serverClient } from "@/lib/supabase/server";
import CouponManager, { type CouponRow } from "@/components/admin/CouponManager";
export default async function Page() {
  const { data } = await serverClient().from("coupons").select("*").order("created_at", { ascending: false });
  return <CouponManager coupons={(data ?? []) as CouponRow[]} />;
}

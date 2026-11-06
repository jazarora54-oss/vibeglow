import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { buildCustomers } from "@/lib/customers";
export const dynamic = "force-dynamic";
/** CSV of customers with their marketing-consent flag. Admins only. */
export async function GET() {
  const sb = serverClient(); let isAdmin: unknown = false;
  try { isAdmin = (await sb.rpc("is_admin")).data; } catch { /* not signed in */ }
  if (isAdmin !== true) return new NextResponse("Not allowed", { status: 401 });
  const [o, s] = await Promise.all([sb.from("orders").select("email,customer_name,phone,total,created_at,status,is_test,data").limit(10000), sb.from("newsletter_subscribers").select("email").eq("unsubscribed", false).not("confirmed_at", "is", null).limit(50000)]);
  if (o.error) return new NextResponse("Could not read orders", { status: 500 });
  const cs = buildCustomers(o.data ?? [], new Set((s.data ?? []).map(r => String(r.email).toLowerCase())));
  const cols = ["email", "name", "phone", "segment", "orders", "total_spent", "avg_order", "first_order", "last_order", "city", "state", "marketing_consent"];
  return new NextResponse(toCsv(cols, cs.map(c => ({ email: c.email, name: c.name, phone: c.phone, segment: c.segment, orders: c.orders, total_spent: c.spent, avg_order: c.avg, first_order: c.first.slice(0, 10), last_order: c.last.slice(0, 10), city: c.city, state: c.state, marketing_consent: c.marketing ? "yes" : "no" }))), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}

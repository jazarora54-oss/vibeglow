import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { parseOrderQuery, applyOrderQuery } from "@/lib/orderFilter";
import type { TemporaryOrder } from "@/types";
export const dynamic = "force-dynamic";
/** CSV of orders (same filters as the Orders page). Admins only. */
export async function GET(req: Request) {
  const sb = serverClient(); let isAdmin: unknown = false;
  try { isAdmin = (await sb.rpc("is_admin")).data; } catch { /* not signed in */ }
  if (isAdmin !== true) return new NextResponse("Not allowed", { status: 401 });
  const f = parseOrderQuery(Object.fromEntries(new URL(req.url).searchParams));
  const { data, error } = await applyOrderQuery(sb.from("orders").select("id,created_at,status,payment_status,customer_name,email,phone,total,invoice_no,tracking_number,data").order("created_at", { ascending: false }).limit(10000), f);
  if (error) return new NextResponse("Could not read orders", { status: 500 });
  const cols = ["order", "date", "status", "payment", "customer", "email", "phone", "items", "subtotal", "discount", "shipping", "tax", "total", "coupon", "ship_city", "ship_state", "ship_zip", "tracking", "invoice"];
  const rows = (data ?? []).map(r => { const o = r.data as TemporaryOrder, s = o?.summary, a = o?.checkout?.shipping_address;
    return { order: r.id, date: String(r.created_at).slice(0, 10), status: r.status, payment: r.payment_status, customer: r.customer_name ?? "", email: r.email, phone: r.phone ?? "", items: s?.item_count ?? "", subtotal: s?.subtotal ?? "", discount: (s?.discount ?? 0) + (s?.deal_discount ?? 0), shipping: s?.shipping ?? "", tax: s?.tax ?? "", total: r.total, coupon: s?.coupon_code ?? "", ship_city: a?.city ?? "", ship_state: a?.state ?? "", ship_zip: a?.zip ?? "", tracking: r.tracking_number ?? "", invoice: r.invoice_no ?? "" }; });
  return new NextResponse(toCsv(cols, rows as any), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}

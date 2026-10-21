import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
export const dynamic = "force-dynamic";
/** CSV of people who are subscribed (unsubscribed addresses are left out). Admins only. */
export async function GET() {
  const sb = serverClient(); let isAdmin: unknown = false;
  try { isAdmin = (await sb.rpc("is_admin")).data; } catch { /* not signed in */ }
  if (isAdmin !== true) return new NextResponse("Not allowed", { status: 401 });
  const { data, error } = await sb.from("newsletter_subscribers").select("email,created_at").eq("unsubscribed", false).order("created_at", { ascending: false }).limit(20000);
  if (error) return new NextResponse("Could not read subscribers", { status: 500 });
  return new NextResponse(toCsv(["email", "signed_up"], (data ?? []).map(r => ({ email: r.email, signed_up: String(r.created_at).slice(0, 10) }))), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="vedaglow-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}

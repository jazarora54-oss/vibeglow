import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { CSV_COLUMNS } from "@/lib/productImport";
export const dynamic = "force-dynamic";
/** Downloads every product as a CSV (the same columns the importer reads). Admins only. */
export async function GET() {
  const sb = serverClient(); let isAdmin: unknown = false;
  try { isAdmin = (await sb.rpc("is_admin")).data; } catch { /* not signed in / not configured */ }
  if (isAdmin !== true) return new NextResponse("Not allowed", { status: 401 });
  const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false }).limit(5000);
  if (error) return new NextResponse("Could not read products", { status: 500 });
  const rows = (data ?? []).map(p => ({ id: p.id, name: p.name, slug: p.slug, category: p.category, price: Number(p.price), compare_at_price: p.compare_at_price != null ? Number(p.compare_at_price) : "", stock: p.stock, sku: p.sku ?? "", brand: p.brand ?? "", short_description: p.short_description ?? "", description: p.description ?? "", tags: (p.tags ?? []).join(";"), is_active: p.is_active ? "yes" : "no", images: (p.images ?? []).join(";"), seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "", gtin: p.gtin ?? "", mpn: p.mpn ?? "" }));
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv([...CSV_COLUMNS], rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="vedaglow-products-${day}.csv"`, "Cache-Control": "no-store" } });
}

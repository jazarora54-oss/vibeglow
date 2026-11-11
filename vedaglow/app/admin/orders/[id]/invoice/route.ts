import { NextResponse } from "next/server";
import { brandOf } from "@/lib/emailTemplates";
import { serverClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/site";
import { loadInvoice, invoicePdf } from "@/lib/invoice";
export const dynamic = "force-dynamic";
/** Invoice PDF for one order. Admins only. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sb = serverClient(); let isAdmin: unknown = false;
  try { isAdmin = (await sb.rpc("is_admin")).data; } catch { /* not signed in */ }
  if (isAdmin !== true) return new NextResponse("Not allowed", { status: 401 });
  const { id } = await ctx.params; const s = await getSiteSettings();
  const inv = await loadInvoice(id, brandOf(s));
  if (!inv) return new NextResponse("Invoice could not be created (is migration-10 run?)", { status: 404 });
  const bytes = await invoicePdf(inv);
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${inv.invoiceNo}.pdf"`, "Cache-Control": "no-store" } });
}

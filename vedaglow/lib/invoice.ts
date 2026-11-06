import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { TemporaryOrder } from "@/types";
import { serviceClient } from "@/lib/supabase/server";

/** Everything printed on an invoice. Only real order data – no invented tax numbers or registrations. */
export interface InvoiceData { invoiceNo: string; invoiceDate: string; orderId: string; orderDate: string; status: string; paymentStatus: string; order: TemporaryOrder; storeName: string; storeEmail?: string }

/** Gives the order an invoice number (same number every time) and returns what is needed to print it. Server only. */
export async function loadInvoice(orderId: string, brand: { store_name?: string; email?: string }): Promise<InvoiceData | null> {
  const db = serviceClient(); if (!db) return null;
  const { data: row } = await db.from("orders").select("id,created_at,status,payment_status,invoice_no,invoice_date,data").eq("id", orderId).maybeSingle();
  if (!row) return null;
  let no = row.invoice_no as string | null, date = row.invoice_date as string | null;
  if (!no) {
    const { data: n, error } = await db.rpc("assign_invoice", { p_id: orderId });
    if (error || !n) return null; // migration-10 not run yet
    no = String(n); date = new Date().toISOString();
  }
  return { invoiceNo: no, invoiceDate: date ?? row.created_at, orderId: row.id, orderDate: row.created_at, status: row.status, paymentStatus: row.payment_status, order: row.data as TemporaryOrder, storeName: brand.store_name || "VEDAGLOW", storeEmail: brand.email };
}

const m = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/New_York" });
/** pdf-lib's built-in fonts only know basic Latin; anything else becomes "?" instead of crashing. */
const safe = (s: unknown) => String(s ?? "").replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7E -ÿ]/g, "?");
const fit = (t: string, f: PDFFont, size: number, w: number) => { let s = safe(t); while (s.length > 1 && f.widthOfTextAtSize(s, size) > w) s = s.slice(0, -2) + "…".replace("…", "."); return s; };

export async function invoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create(); pdf.setTitle(`Invoice ${d.invoiceNo}`); pdf.setProducer("VEDAGLOW");
  const reg = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.06, 0.25, 0.18), grey = rgb(0.4, 0.4, 0.4);
  const W = 595, H = 842, L = 48, R = W - 48;
  let page = pdf.addPage([W, H]); let y = H - 56;
  const text = (t: string, x: number, yy: number, o: { size?: number; bold?: boolean; color?: any; right?: boolean } = {}) => {
    const f = o.bold ? bold : reg, size = o.size ?? 10, s = safe(t); const xx = o.right ? x - f.widthOfTextAtSize(s, size) : x;
    page.drawText(s, { x: xx, y: yy, size, font: f, color: o.color ?? rgb(0.1, 0.1, 0.1) });
  };
  text(d.storeName, L, y, { size: 22, bold: true, color: green }); text("INVOICE", R, y, { size: 22, bold: true, right: true, color: green });
  y -= 20; if (d.storeEmail) text(d.storeEmail, L, y, { color: grey });
  text(`Invoice no: ${d.invoiceNo}`, R, y, { right: true, bold: true }); y -= 14;
  text(`Invoice date: ${day(d.invoiceDate)}`, R, y, { right: true, color: grey }); y -= 14;
  text(`Order: ${d.orderId}  (placed ${day(d.orderDate)})`, R, y, { right: true, color: grey }); y -= 14;
  text(`Payment: ${d.paymentStatus.toUpperCase()}`, R, y, { right: true, bold: true, color: d.paymentStatus === "paid" ? green : rgb(0.7, 0.1, 0.1) });
  y -= 30;
  const c = d.order.checkout, bill = c.billing_address, ship = c.shipping_address;
  const block = (title: string, a: typeof bill, x: number) => {
    let yy = y; text(title, x, yy, { bold: true, color: green }); yy -= 14;
    for (const line of [`${a.first_name} ${a.last_name}`, a.address1, a.address2 ?? "", `${a.city}, ${a.state} ${a.zip}`, a.country]) if (line.trim()) { text(line, x, yy); yy -= 13; }
    return yy;
  };
  const y1 = block("Bill to", bill, L), y2 = block("Ship to", ship, 320); y = Math.min(y1, y2) - 6;
  text(c.contact.email, L, y, { color: grey }); y -= 26;
  const head = () => { page.drawRectangle({ x: L - 6, y: y - 6, width: R - L + 12, height: 20, color: rgb(0.94, 0.92, 0.86) }); text("Item", L, y, { bold: true }); text("Qty", 360, y, { bold: true, right: true }); text("Price", 440, y, { bold: true, right: true }); text("Total", R, y, { bold: true, right: true }); y -= 22; };
  head();
  for (const i of d.order.items) {
    if (y < 150) { page = pdf.addPage([W, H]); y = H - 56; head(); }
    const name = fit(i.name + (i.variant_label ? ` - ${i.variant_label}` : ""), reg, 10, 290);
    text(name, L, y); text(String(i.quantity), 360, y, { right: true }); text(m(i.unit_price), 440, y, { right: true }); text(m(i.line_total), R, y, { right: true });
    if (i.sku) { y -= 11; text(`SKU ${i.sku}`, L, y, { size: 8, color: grey }); } y -= 16;
  }
  if (y < 190) { page = pdf.addPage([W, H]); y = H - 56; }
  y -= 4; page.drawLine({ start: { x: 300, y: y + 8 }, end: { x: R, y: y + 8 }, thickness: 0.7, color: grey });
  const s = d.order.summary; const row = (l: string, v: string, b = false) => { text(l, 320, y, { bold: b }); text(v, R, y, { right: true, bold: b }); y -= 16; };
  row("Subtotal", m(s.subtotal));
  for (const dl of s.deals ?? []) row(`Sale: ${safe(dl.name).slice(0, 28)}`, `-${m(dl.amount)}`);
  if (s.discount > 0) row(`Discount${s.coupon_code ? ` (${safe(s.coupon_code)})` : ""}`, `-${m(s.discount)}`);
  row(`Shipping${d.order.shipping_method?.name ? ` (${safe(d.order.shipping_method.name).slice(0, 22)})` : ""}`, m(s.shipping));
  if (s.tax > 0) row("Tax", m(s.tax));
  page.drawLine({ start: { x: 300, y: y + 10 }, end: { x: R, y: y + 10 }, thickness: 0.7, color: grey }); y -= 2;
  row("Total", m(s.total), true);
  text("Thank you for shopping with " + d.storeName + ".", L, 60, { color: grey, size: 9 });
  return pdf.save();
}

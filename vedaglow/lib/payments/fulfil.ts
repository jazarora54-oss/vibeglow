import type { PaymentInfo, TemporaryOrder } from "@/types";
import { adjustStock } from "@/lib/orderStock";
import { adminNewOrder, orderConfirmation, refundEmail, refundNoticeAdmin, invoiceEmail, type Brand } from "@/lib/emailTemplates";
import { loadInvoice, invoicePdf } from "@/lib/invoice";
import { emailConfigured, sendEmail } from "@/lib/email";
import { cents } from "./stripe";
/** What happens in the database when Stripe tells us something. `db` is the service-role Supabase client (a plain object in tests). All of these are safe to run twice. */
type Db = any;
const note = (old: unknown, add: string) => [String(old ?? "").trim(), add].filter(Boolean).join("\n").slice(0, 2000);

export async function markPaid(db: Db, orderId: string, s: { id: string; payment_intent?: string; amount_total?: number }, brand: Brand, notifyTo?: string, autoInvoice = false): Promise<string> {
  const { data: row } = await db.from("orders").select("status,payment_status,notes,data").eq("id", orderId).maybeSingle();
  if (!row) return "unknown order";
  const o = row.data as TemporaryOrder; const prev = o.payment as PaymentInfo | undefined;
  if (row.payment_status === "paid" && prev?.session_id === s.id) return "already paid";
  if (typeof s.amount_total === "number" && s.amount_total !== cents(o.summary.total)) {
    await db.from("orders").update({ notes: note(row.notes, `⚠ Stripe took ${(s.amount_total / 100).toFixed(2)} but the order total is ${o.summary.total.toFixed(2)}. Check in Stripe before shipping.`) }).eq("id", orderId); return "amount mismatch";
  }
  const payment: PaymentInfo = { provider: "stripe", session_id: s.id, payment_intent: s.payment_intent, amount: (s.amount_total ?? cents(o.summary.total)) / 100, paid_at: new Date().toISOString(), emailed: prev?.emailed };
  const patch: Record<string, unknown> = { payment_status: "paid", data: { ...o, payment } };
  if (row.status === "pending") patch.status = "processing";
  if (row.status === "cancelled") patch.notes = note(row.notes, "⚠ Paid AFTER the order was cancelled (payment page expired). Refund it or re-open the order.");
  await db.from("orders").update(patch).eq("id", orderId);
  if (!payment.emailed && emailConfigured()) {
    try {
      payment.emailed = true; await db.from("orders").update({ data: { ...o, payment } }).eq("id", orderId); // mark first so a retry never mails twice
      const mc = orderConfirmation(brand, o); const ma = adminNewOrder(brand, o);
      await Promise.allSettled([sendEmail({ to: o.checkout.contact.email.trim(), kind: "order_confirmation", dedupeKey: `order_confirmation:${orderId}`, orderId, ...mc }), notifyTo ? sendEmail({ to: notifyTo, kind: "admin_new_order", dedupeKey: `admin_new_order:${orderId}`, orderId, ...ma }) : Promise.resolve()]);
      if (autoInvoice) { // only when switched on in Business Email settings; sent once per order, never because someone printed the invoice
        const inv = await loadInvoice(orderId, brand); if (inv) await sendEmail({ to: o.checkout.contact.email.trim(), kind: "invoice", dedupeKey: `invoice:${orderId}`, orderId, attachments: [{ filename: `${inv.invoiceNo}.pdf`, content: Buffer.from(await invoicePdf(inv)), contentType: "application/pdf" }], ...invoiceEmail(brand, o, inv.invoiceNo) });
      }
    } catch (e) { console.error("paid email error:", e); }
  }
  return "paid";
}
/** The payment page timed out: cancel the unpaid order and put the stock back. */
export async function expireOrder(db: Db, orderId: string, sessionId?: string): Promise<string> {
  const { data: row } = await db.from("orders").select("status,payment_status,stock_restored,notes,data").eq("id", orderId).maybeSingle();
  if (!row) return "unknown order";
  if (row.payment_status !== "unpaid" || row.status !== "pending") return "nothing to do";
  const o = row.data as TemporaryOrder; let restored = Boolean(row.stock_restored);
  if (sessionId && o.payment?.session_id && o.payment.session_id !== sessionId) return "superseded by a newer payment page"; // the customer retried: the order is still payable
  if (!restored) { await adjustStock(db, o.items ?? [], 1); restored = true; }
  await db.from("orders").update({ status: "cancelled", stock_restored: restored, notes: note(row.notes, "Cancelled automatically: the card payment was not completed in time. Stock was put back.") }).eq("id", orderId);
  return "cancelled";
}
export async function markRefunded(db: Db, paymentIntent: string, brand?: Brand, refundNoticeTo?: string): Promise<string> {
  const { data: row } = await db.from("orders").select("id,email,payment_status,data").eq("data->payment->>payment_intent", paymentIntent).maybeSingle();
  if (!row) return "unknown order"; if (row.payment_status === "refunded") return "already refunded";
  const o = row.data as TemporaryOrder;
  const prev = o.payment as PaymentInfo; let mailed = Boolean(prev?.refund_emailed);
  if (!mailed && brand && emailConfigured() && row.email) { try { mailed = (await sendEmail({ to: String(row.email).trim(), kind: "refund", dedupeKey: `refund:${row.id}`, orderId: row.id, ...refundEmail(brand, o) })).ok; if (refundNoticeTo) await sendEmail({ to: refundNoticeTo, kind: "refund_admin", dedupeKey: `refund_admin:${row.id}`, orderId: row.id, ...refundNoticeAdmin(brand, o) }); } catch (e) { console.error("refund email error:", e); } }
  await db.from("orders").update({ payment_status: "refunded", data: { ...o, payment: { ...prev, refunded_at: new Date().toISOString(), refund_emailed: mailed } } }).eq("id", row.id);
  return "refunded";
}

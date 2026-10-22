import type { PaymentInfo, TemporaryOrder } from "@/types";
import { adjustStock } from "@/lib/orderStock";
import { adminNewOrder, orderConfirmation } from "@/lib/emailTemplates";
import { emailConfigured, sendEmail } from "@/lib/email";
import { cents } from "./stripe";
/** What happens in the database when Stripe tells us something. `db` is the service-role Supabase client (a plain object in tests). All of these are safe to run twice. */
type Db = any;
const note = (old: unknown, add: string) => [String(old ?? "").trim(), add].filter(Boolean).join("\n").slice(0, 2000);

export async function markPaid(db: Db, orderId: string, s: { id: string; payment_intent?: string; amount_total?: number }, brand: { store_name: string; email?: string }, notifyTo?: string): Promise<string> {
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
      await Promise.allSettled([sendEmail({ to: o.checkout.contact.email.trim(), ...mc }), notifyTo ? sendEmail({ to: notifyTo, ...ma }) : Promise.resolve()]);
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
export async function markRefunded(db: Db, paymentIntent: string): Promise<string> {
  const { data: row } = await db.from("orders").select("id,payment_status,data").eq("data->payment->>payment_intent", paymentIntent).maybeSingle();
  if (!row) return "unknown order"; if (row.payment_status === "refunded") return "already refunded";
  const o = row.data as TemporaryOrder;
  await db.from("orders").update({ payment_status: "refunded", data: { ...o, payment: { ...(o.payment as PaymentInfo), refunded_at: new Date().toISOString() } } }).eq("id", row.id);
  return "refunded";
}

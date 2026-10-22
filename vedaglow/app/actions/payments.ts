"use server";
import { serviceClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";
import { rateLimitOk } from "@/lib/rateLimit";
import { createCheckoutSession, stripeConfigured } from "@/lib/payments/stripe";
import { markPaid } from "@/lib/payments/fulfil";
import { getSiteSettings } from "@/lib/data/site";
import type { TemporaryOrder } from "@/types";
const idOk = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9_-]{6,40}$/.test(x);
/** After the order is saved: opens the Stripe payment page for it. The email must match the order (the order number alone is not enough). */
export async function startPayment(orderId: string, email: string): Promise<{ ok: boolean; url?: string; message?: string }> {
  try {
    if (!stripeConfigured()) return { ok: false, message: "Card payment is not set up yet." };
    const db = serviceClient(); if (!db || !idOk(orderId)) return { ok: false, message: "Order not found." };
    if (!(await rateLimitOk("pay", 20, 3600))) return { ok: false, message: "Too many attempts. Please try again in a little while." };
    const { data: row } = await db.from("orders").select("status,payment_status,email,data").eq("id", orderId).maybeSingle();
    if (!row || String(row.email).trim().toLowerCase() !== String(email ?? "").trim().toLowerCase()) return { ok: false, message: "Order not found." };
    if (row.payment_status === "paid") return { ok: true, url: `${siteUrl()}/order-confirmation/${encodeURIComponent(orderId)}?paid=1` };
    if (row.status !== "pending") return { ok: false, message: "This order can no longer be paid. Please place a new order." };
    const o = row.data as TemporaryOrder;
    if (!(o.summary.total > 0)) { const st = await getSiteSettings(); await markPaid(db, orderId, { id: `free-${orderId}`, amount_total: 0 }, { store_name: st.store_name, email: st.email }, process.env.ORDER_NOTIFY_EMAIL || st.email); return { ok: true, url: `${siteUrl()}/order-confirmation/${encodeURIComponent(orderId)}?paid=1` }; }
    const r = await createCheckoutSession(o, siteUrl());
    if (!r.ok) { console.error("stripe session failed:", r.message); return { ok: false, message: "We could not open the payment page. Please try again in a moment." }; }
    await db.from("orders").update({ data: { ...o, payment: { ...(o.payment ?? {}), provider: "stripe", session_id: r.id } } }).eq("id", orderId); // remember the newest payment page
    return { ok: true, url: r.url };
  } catch (e) { console.error("startPayment error:", e); return { ok: false, message: "We could not open the payment page. Please try again." }; }
}
/** For the confirmation page: has this order been paid yet? Says nothing else about the order. */
export async function getPaymentState(orderId: string): Promise<{ online: boolean; paid: boolean; cancelled: boolean }> {
  try {
    const db = serviceClient(); if (!db || !idOk(orderId)) return { online: false, paid: false, cancelled: false };
    const { data: row } = await db.from("orders").select("status,payment_status,data").eq("id", orderId).maybeSingle();
    if (!row) return { online: false, paid: false, cancelled: false };
    const online = (row.data as TemporaryOrder)?.checkout?.payment_method === "Card (Stripe)";
    return { online, paid: row.payment_status === "paid" || row.payment_status === "refunded", cancelled: row.status === "cancelled" };
  } catch { return { online: false, paid: false, cancelled: false }; }
}
export async function paymentsAvailable(): Promise<boolean> { return stripeConfigured(); }

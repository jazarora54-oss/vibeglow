import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/site";
import { verifyWebhook, webhookSecret } from "@/lib/payments/stripe";
import { expireOrder, markPaid, markRefunded } from "@/lib/payments/fulfil";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Stripe calls this address when a payment finishes. Only messages signed with STRIPE_WEBHOOK_SECRET are accepted. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("stripe-signature"), webhookSecret())) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const db = serviceClient(); if (!db) return NextResponse.json({ error: "database not configured" }, { status: 500 });
  let ev: any; try { ev = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const obj = ev?.data?.object ?? {};
  try {
    if (ev.type === "checkout.session.completed" && obj.payment_status === "paid" && obj.metadata?.order_id) {
      const st = await getSiteSettings();
      await markPaid(db, String(obj.metadata.order_id), { id: String(obj.id), payment_intent: typeof obj.payment_intent === "string" ? obj.payment_intent : undefined, amount_total: typeof obj.amount_total === "number" ? obj.amount_total : undefined }, { store_name: st.store_name, email: st.email }, process.env.ORDER_NOTIFY_EMAIL || st.email);
    } else if (ev.type === "checkout.session.expired" && obj.metadata?.order_id) await expireOrder(db, String(obj.metadata.order_id), String(obj.id));
    else if (ev.type === "charge.refunded" && obj.refunded === true && typeof obj.payment_intent === "string") await markRefunded(db, obj.payment_intent);
  } catch (e) { console.error("stripe webhook error:", e); return NextResponse.json({ error: "failed" }, { status: 500 }); } // Stripe will retry
  return NextResponse.json({ received: true });
}

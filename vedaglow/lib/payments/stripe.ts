import { createHmac, timingSafeEqual } from "crypto";
import type { TemporaryOrder } from "@/types";
/** Stripe Checkout, called straight over HTTPS (no extra package). Card details never touch this website: customers pay on Stripe's own page. */
export const stripeKey = () => (process.env.STRIPE_SECRET_KEY ?? "").trim();
export const stripeConfigured = () => /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$/.test(stripeKey());
export const stripeMode = (): "live" | "test" | "off" => !stripeConfigured() ? "off" : /_live_/.test(stripeKey()) ? "live" : "test";
export const webhookSecret = () => (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
export const cents = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100);
const MIN_CENTS = 50; // Stripe's minimum charge in USD

export type SessionResult = { ok: true; params: URLSearchParams; couponCents: number } | { ok: false; message: string };
/** Builds the Stripe Checkout request from the order saved in OUR database (never from the browser). It refuses if the pieces do not add up to the order total. */
export function buildSession(o: TemporaryOrder, base: string, now = Date.now()): SessionResult {
  const s = o.summary; const p = new URLSearchParams(); let k = 0; let sum = 0;
  const add = (name: string, unit: number, qty: number, img?: string) => {
    p.append(`line_items[${k}][price_data][currency]`, "usd"); p.append(`line_items[${k}][price_data][product_data][name]`, name.slice(0, 200) || "Item");
    if (img && /^https:\/\//i.test(img) && img.length < 1800) p.append(`line_items[${k}][price_data][product_data][images][0]`, img);
    p.append(`line_items[${k}][price_data][unit_amount]`, String(unit)); p.append(`line_items[${k}][quantity]`, String(qty)); sum += unit * qty; k++;
  };
  for (const i of o.items) { const unit = cents(i.unit_price); if (!(unit >= 0) || !Number.isInteger(i.quantity) || i.quantity < 1) return { ok: false, message: "This order has an invalid item." }; add(i.variant_label ? `${i.name} (${i.variant_label})` : i.name, unit, i.quantity, i.image); }
  if (s.tax > 0) add("Sales tax", cents(s.tax), 1);
  const disc = cents((s.discount ?? 0) + (s.deal_discount ?? 0)); const ship = cents(s.shipping);
  const expected = sum - Math.min(disc, sum) + ship, total = cents(s.total);
  if (expected !== total) return { ok: false, message: "The order amounts do not add up, so payment was not started. Please contact us." };
  if (total < MIN_CENTS) return { ok: false, message: "The order total is below the card minimum of $0.50." };
  p.append("mode", "payment"); p.append("client_reference_id", o.id); p.append("customer_email", o.checkout.contact.email.trim());
  p.append("metadata[order_id]", o.id); p.append("payment_intent_data[metadata][order_id]", o.id); p.append("payment_intent_data[description]", `Order ${o.id}`);
  p.append("shipping_options[0][shipping_rate_data][type]", "fixed_amount"); p.append("shipping_options[0][shipping_rate_data][display_name]", (o.shipping_method?.name || "Shipping").slice(0, 100));
  p.append("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(ship)); p.append("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
  p.append("expires_at", String(Math.floor(now / 1000) + 31 * 60));
  p.append("success_url", `${base}/order-confirmation/${encodeURIComponent(o.id)}?paid=1`); p.append("cancel_url", `${base}/checkout?cancelled=1`);
  return { ok: true, params: p, couponCents: Math.min(disc, sum) };
}

type Json = Record<string, any>;
async function call(path: string, method: "GET" | "POST", body?: URLSearchParams, idem?: string): Promise<{ ok: boolean; status: number; json: Json }> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(`https://api.stripe.com${path}`, { method, body, signal: ctl.signal, cache: "no-store", headers: { Authorization: `Bearer ${stripeKey()}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idem ? { "Idempotency-Key": idem } : {}) } });
    let json: Json = {}; try { json = await res.json(); } catch { /* ignore */ }
    return { ok: res.ok, status: res.status, json };
  } catch { return { ok: false, status: 0, json: {} }; } finally { clearTimeout(t); }
}
const why = (r: { status: number; json: Json }) => r.status === 0 ? "Could not reach Stripe." : String(r.json?.error?.message ?? `Stripe error ${r.status}`).slice(0, 300);

/** Starts the payment page for an order. Calling it again makes a fresh page; the newest one is remembered on the order (see expireOrder). */
export async function createCheckoutSession(o: TemporaryOrder, base: string): Promise<{ ok: true; url: string; id: string } | { ok: false; message: string }> {
  if (!stripeConfigured()) return { ok: false, message: "Card payment is not set up yet." };
  const b = buildSession(o, base); if (!b.ok) return b;
  if (b.couponCents > 0) { // Stripe cannot take a negative line, so the discount is sent as a one-time coupon
    const c = new URLSearchParams({ amount_off: String(b.couponCents), currency: "usd", duration: "once", max_redemptions: "1", name: "Discount" });
    const cr = await call("/v1/coupons", "POST", c, `vg-cpn-${o.id}-${b.couponCents}`); if (!cr.ok || !cr.json.id) return { ok: false, message: why(cr) };
    b.params.append("discounts[0][coupon]", String(cr.json.id));
  }
  const r = await call("/v1/checkout/sessions", "POST", b.params);
  if (!r.ok || !r.json.url) return { ok: false, message: why(r) };
  return { ok: true, url: String(r.json.url), id: String(r.json.id) };
}
export async function refundPayment(paymentIntent: string, orderId: string): Promise<{ ok: boolean; message?: string }> {
  if (!stripeConfigured()) return { ok: false, message: "Stripe is not set up." };
  if (!/^pi_[A-Za-z0-9_]+$/.test(paymentIntent)) return { ok: false, message: "No Stripe payment is saved on this order." };
  const r = await call("/v1/refunds", "POST", new URLSearchParams({ payment_intent: paymentIntent, "metadata[order_id]": orderId }), `vg-refund-${paymentIntent}`);
  return r.ok ? { ok: true } : { ok: false, message: why(r) };
}
export async function checkConnection(): Promise<{ ok: boolean; message: string }> {
  if (!stripeConfigured()) return { ok: false, message: "STRIPE_SECRET_KEY is not set (or does not look like sk_test_… / sk_live_…)." };
  const r = await call("/v1/balance", "GET");
  return r.ok ? { ok: true, message: `Connected to Stripe in ${stripeMode()} mode.` } : { ok: false, message: why(r) };
}

/** Checks the "Stripe-Signature" header of a webhook. Rejects forged or old (over 5 minutes) messages. */
export function verifyWebhook(raw: string, header: string | null, secret: string, now = Date.now(), toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  let t = ""; const sigs: string[] = [];
  for (const part of header.split(",")) { const [k, v] = part.split("="); if (k?.trim() === "t") t = (v ?? "").trim(); else if (k?.trim() === "v1" && v) sigs.push(v.trim()); }
  if (!/^\d+$/.test(t) || !sigs.length) return false;
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return false;
  const want = createHmac("sha256", secret).update(`${t}.${raw}`).digest();
  return sigs.some(s => { try { const b = Buffer.from(s, "hex"); return b.length === want.length && timingSafeEqual(b, want); } catch { return false; } });
}

"use server";
import type { CartItem, CheckoutData, Coupon, OrderItem, TemporaryOrder } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
import { serviceClient } from "@/lib/supabase/server";
import { findCoupon, calculateSummary, getShippingMethod } from "@/lib/cart/cartCalculations";
import { DELIVERY_DAYS } from "@/lib/cart/config";
import { getProductBySlug } from "@/lib/data/products";
import { answerQuestion } from "@/lib/chatbot";
import { validateAddress, validateContact } from "@/lib/checkout/validation";

/** Coupon check. Database coupons when Supabase is configured, otherwise the demo coupons. */
export async function lookupCoupon(code: string): Promise<Coupon | null> {
  const c = String(code ?? "").trim();
  if (!c || c.length > 40) return null;
  if (!isSupabaseConfigured) return findCoupon(c) ?? null;
  const { data } = await publicClient().rpc("get_coupon", { p_code: c });
  const r = Array.isArray(data) ? data[0] : null;
  return r ? { code: r.code, percent_off: r.percent_off ? Number(r.percent_off) : undefined, amount_off: r.amount_off ? Number(r.amount_off) : undefined, min_subtotal: r.min_subtotal ? Number(r.min_subtotal) : undefined } : null;
}

export type SubmitResult = { status: "ok"; order: TemporaryOrder } | { status: "error"; message: string } | { status: "local" };
type Line = { product_id: string; variant_id?: string; quantity: number };
const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const newId = () => {
  const d = new Date(); const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `VDG-${ymd}-${s}`;
};

/**
 * Creates the order in the database. Prices, stock and coupon are ALL re-checked here from the database;
 * whatever the browser sent for prices is ignored. Returns {status:"local"} when Supabase / the service key is not set up.
 */
export async function submitOrder(input: { items: Line[]; checkout: CheckoutData; coupon_code?: string }): Promise<SubmitResult> {
  const db = serviceClient();
  if (!isSupabaseConfigured || !db) return { status: "local" };
  const lines = (input?.items ?? []).filter(l => l && typeof l.product_id === "string" && Number.isInteger(l.quantity) && l.quantity >= 1 && l.quantity <= 99).slice(0, 50);
  if (!lines.length) return { status: "error", message: "Your cart is empty." };
  const co = input.checkout;
  if (!co?.contact || !co?.shipping_address || !co?.billing_address) return { status: "error", message: "Missing checkout details." };
  if (Object.keys(validateContact(co.contact)).length || Object.keys(validateAddress(co.shipping_address)).length || Object.keys(validateAddress(co.billing_address)).length) return { status: "error", message: "Please check your contact and address details." };

  const { data: rows, error } = await db.from("products").select("*").in("id", [...new Set(lines.map(l => l.product_id))]).eq("is_active", true);
  if (error || !rows) return { status: "error", message: "Could not verify your items. Please try again." };
  const byId = new Map(rows.map((r: any) => [r.id as string, r]));
  const items: OrderItem[] = []; const cart: CartItem[] = []; const stockUpdates = new Map<string, any>();
  for (const l of lines) {
    const p: any = byId.get(l.product_id);
    if (!p) return { status: "error", message: "An item in your cart is no longer available. Please remove it and try again." };
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    const v = l.variant_id ? variants.find(x => x.id === l.variant_id) : undefined;
    if (l.variant_id && !v) return { status: "error", message: `${p.name} option is no longer available.` };
    if (!l.variant_id && variants.length) return { status: "error", message: `Please choose an option for ${p.name}.` };
    const stock = v ? v.stock : p.stock;
    const already = (stockUpdates.get(p.id)?.used?.[l.variant_id ?? "-"] ?? 0) as number;
    if (l.quantity + already > stock) return { status: "error", message: stock <= 0 ? `${p.name} is out of stock.` : `Only ${stock} of ${p.name} available.` };
    const u = stockUpdates.get(p.id) ?? { row: p, used: {} as Record<string, number> }; u.used[l.variant_id ?? "-"] = already + l.quantity; stockUpdates.set(p.id, u);
    const unit = Math.round(Number(v ? v.price : p.price) * 100) / 100;
    const base = { product_id: p.id, variant_id: v?.id, name: p.name, slug: p.slug, variant_label: v?.label, sku: v?.sku ?? p.sku ?? undefined, image: p.images?.[0], visual: p.visual, quantity: l.quantity, unit_price: unit };
    items.push({ ...base, line_total: Math.round(unit * l.quantity * 100) / 100 }); cart.push(base);
  }
  const coupon = input.coupon_code ? await lookupCoupon(input.coupon_code) : null;
  const method = getShippingMethod(co.shipping_method_id);
  const summary = calculateSummary(cart, coupon, method.id);
  const a = new Date(), b = new Date(); a.setDate(a.getDate() + DELIVERY_DAYS.min); b.setDate(b.getDate() + DELIVERY_DAYS.max);

  for (let attempt = 0; attempt < 4; attempt++) {
    const order: TemporaryOrder = { id: newId(), created_at: new Date().toISOString(), status: "pending-payment", items, summary, checkout: { ...co, payment_method: String(co.payment_method ?? "").slice(0, 60) }, shipping_method: method, estimated_delivery: `${fmtDate(a)} – ${fmtDate(b)} (${method.eta})` };
    const { error: e } = await db.from("orders").insert({ id: order.id, status: "pending", payment_status: "unpaid", email: co.contact.email.trim(), phone: co.contact.phone.trim(), customer_name: `${co.shipping_address.first_name} ${co.shipping_address.last_name}`.trim(), total: summary.total, data: order });
    if (e?.code === "23505") continue; // id collision, try a new one
    if (e) { console.error("order insert failed:", e.message); return { status: "error", message: "Could not save your order. Please try again." }; }
    // Reduce stock (small shop: read-modify-write is fine) and count the coupon use.
    for (const { row, used } of stockUpdates.values()) {
      const variants: any[] = Array.isArray(row.variants) ? row.variants : [];
      if (variants.length) { const nv = variants.map(v => ({ ...v, stock: Math.max(0, v.stock - (used[v.id] ?? 0)) })); await db.from("products").update({ variants: nv, stock: nv.reduce((s, v) => s + v.stock, 0) }).eq("id", row.id); }
      else await db.from("products").update({ stock: Math.max(0, row.stock - (used["-"] ?? 0)) }).eq("id", row.id);
    }
    if (summary.coupon_code) { const { data: c } = await db.from("coupons").select("used_count").eq("code", summary.coupon_code).maybeSingle(); if (c) await db.from("coupons").update({ used_count: (c.used_count ?? 0) + 1 }).eq("code", summary.coupon_code); }
    return { status: "ok", order };
  }
  return { status: "error", message: "Could not create an order number. Please try again." };
}

/** Current stock for cart lines (key -> stock). Runs on the server so stock comes straight from the database. */
export async function getStockForLines(lines: { key: string; slug?: string; variant_id?: string }[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all((lines ?? []).slice(0, 50).map(async l => {
    const p = l.slug ? await getProductBySlug(String(l.slug)) : null;
    const v = p?.variants?.find(x => x.id === l.variant_id);
    out[String(l.key)] = !p ? 0 : v ? v.stock : l.variant_id ? 0 : p.stock;
  }));
  return out;
}

/** Chat assistant (free, rule-based; answers from admin -> FAQs and the product list). */
export async function askAssistant(message: string): Promise<string> { return answerQuestion(message); }

/** Contact form -> saved in the database; you read it in admin -> Messages. */
export async function submitContact(input: { name: string; email: string; subject?: string; message: string; website?: string }): Promise<{ ok: boolean; message: string }> {
  if (input?.website) return { ok: true, message: "Thank you! We will get back to you soon." }; // hidden field filled = bot
  const name = String(input?.name ?? "").trim().slice(0, 100), email = String(input?.email ?? "").trim().slice(0, 160);
  const subject = String(input?.subject ?? "").trim().slice(0, 150), message = String(input?.message ?? "").trim().slice(0, 4000);
  if (name.length < 2) return { ok: false, message: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Please enter a valid email address." };
  if (message.length < 10) return { ok: false, message: "Please write a little more in your message." };
  const db = serviceClient();
  if (!isSupabaseConfigured || !db) return { ok: false, message: "Messaging is not available right now. Please try again later." };
  const { error } = await db.from("messages").insert({ name, email, subject: subject || null, message });
  if (error) { console.error("contact insert failed:", error.message); return { ok: false, message: "Could not send your message. Please try again." }; }
  return { ok: true, message: "Thank you! Your message has been sent. We will get back to you soon." };
}

export type TrackResult =
  | { ok: true; order: { id: string; status: string; payment_status: string; tracking_info?: string; estimated_delivery?: string; total: number; items: { name: string; variant_label?: string; quantity: number }[] } }
  | { ok: false; message: string };
/** Customer order tracking. Needs BOTH the order number and the matching email, so strangers cannot browse orders. */
export async function trackOrder(orderId: string, email: string): Promise<TrackResult> {
  const nope: TrackResult = { ok: false, message: "We could not find an order with those details. Please check the order number and email." };
  const id = String(orderId ?? "").trim().toUpperCase().slice(0, 40), em = String(email ?? "").trim().toLowerCase().slice(0, 160);
  if (!id || !em) return nope;
  const db = serviceClient();
  if (!isSupabaseConfigured || !db) return { ok: false, message: "Order tracking is not available yet." };
  const { data } = await db.from("orders").select("id,status,payment_status,tracking_info,total,email,data").eq("id", id).maybeSingle();
  if (!data || String(data.email).trim().toLowerCase() !== em) return nope;
  const o = data.data as TemporaryOrder;
  return { ok: true, order: { id: data.id, status: data.status, payment_status: data.payment_status, tracking_info: data.tracking_info ?? undefined, estimated_delivery: o.estimated_delivery, total: Number(data.total), items: (o.items ?? []).map(i => ({ name: i.name, variant_label: i.variant_label, quantity: i.quantity })) } };
}

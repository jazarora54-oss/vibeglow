"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { productToRow, slugify, autoSeo, type ProductInput } from "@/lib/data/mappers";
import { getLocalProducts } from "@/lib/data/products";
import { DEFAULT_FAQS, DEFAULT_PAGES, isPageSlug, type SiteSettings } from "@/lib/data/defaults";
import { stateCode, trackingUrl, CARRIERS } from "@/lib/shipping/rules";
import { getSiteSettings, getSettingsWithPrivate, PRIVATE_SETTING_KEYS } from "@/lib/data/site";
import { shipFromOf } from "@/lib/shipping/settings";
import { buyShippoLabel, getShippoRate, getShippoRates, rateKey, shippoConfigured } from "@/lib/shipping/shippo";
import type { OrderItem, Parcel, RateOption, ShipAddress, TemporaryOrder } from "@/types";
import { emailConfigured, marketingEnabled, sendBatch, sendEmail, retryLogged, testConnection } from "@/lib/email";
import { loadInvoice, invoicePdf } from "@/lib/invoice";
import { offerEmail, statusUpdate, refundEmail, refundNoticeAdmin, testEmail, brandOf, notifyEmail, invoiceEmail, contactReply } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/site";
import { audit } from "@/lib/audit";
import { adjustStock } from "@/lib/orderStock";
import { colorIssues, contrast, isHex } from "@/lib/theme";
import { safeLink, topbarLines } from "@/lib/topbar";
import { aiConfig, generate } from "@/lib/ai/provider";
import { parseDraft, scanClaims, SYSTEM_PROMPT, userPrompt, cleanUrls, SENSITIVE, type AiDraft } from "@/lib/ai/draft";
import { gaId, pixelId, verifyToken } from "@/lib/seo";
import { checkConnection, refundPayment } from "@/lib/payments/stripe";
import { homeSectionsOf } from "@/lib/data/homeSections";
import { DEFAULT_CATEGORIES } from "@/lib/data/categories";
import { validateImport, summarize, tableToRows, TAGS, type Existing, type RowResult } from "@/lib/productImport";

type Res = { ok: boolean; message?: string; id?: string };
/** Every admin action starts here: signed in AND listed in `admins`. Row Level Security re-checks it in the database. */
async function admin() {
  const sb = serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) throw new Error("Not an admin.");
  return sb;
}
const refresh = () => { revalidatePath("/", "layout"); };
const fail = (e: unknown): Res => ({ ok: false, message: e instanceof Error ? e.message : "Something went wrong." });
const dbMsg = (m: string) => /\breviews\b|newsletter_subscribers|redirects/i.test(m) ? "The database is missing the newest tables. Open Supabase -> SQL Editor, run supabase/migration-8.sql, then try again." : /seo_noindex|\bcategories\b/i.test(m) ? "The database is missing the newest category tables. Open Supabase -> SQL Editor, run supabase/migration-7.sql, then try again." : /is_test|audit_log|rate_limits/i.test(m) ? "The database is missing the newest security tables. Open Supabase -> SQL Editor, run supabase/migration-6.sql, then try again." : /\bdeals\b/i.test(m) ? "The database is missing the Deals table. Open Supabase -> SQL Editor, run supabase/migration-5.sql, then try again." : /duplicate key|unique/i.test(m) ? "That slug / code already exists. Please use a different one." : /shipping_mode|shipping_flat|shipping_extra|handling_days|pkg_(length|width|height)|label_cost|tracking_number/i.test(m) ? "The database is missing the new shipping columns. Open Supabase -> SQL Editor, run supabase/migration-3.sql, then try again." : /stock_restored|offer_subscribers|product_views|product_watch|coupons.*product_id|schema cache/i.test(m) ? "The database is missing the newest columns. Open Supabase -> SQL Editor, run supabase/migration-3.sql and then supabase/migration-4.sql, then try again." : m;

export async function signOut() { const sb = serverClient(); await sb.auth.signOut(); redirect("/admin/login"); }

// ---------- Products ----------
export async function saveProduct(input: ProductInput): Promise<Res> {
  try {
    const sb = await admin();
    if (!input.name?.trim()) return { ok: false, message: "Product name is required." };
    if (!(Number(input.price) >= 0) || input.price === ("" as unknown)) return { ok: false, message: "Enter a valid price." };
    if (input.shipping_mode === "calculated" && !(Number(input.weight_g) > 0)) return { ok: false, message: "Shipping: \"Calculated\" needs the package weight (lb / oz). Add the weight, or choose Flat rate or Free shipping." };
    for (const [v, name] of [[input.shipping_flat_price, "Shipping price"], [input.shipping_extra_price, "Additional item price"]] as const) if (v != null && (v as unknown) !== "" && !(Number(v) >= 0)) return { ok: false, message: `${name} must be 0 or more.` };
    const slug = slugify(input.slug || input.name); if (!slug) return { ok: false, message: "Slug is required." };
    const id = input.id || `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const row = productToRow({ ...input, id, slug });
    const { error } = await sb.from("products").upsert(row, { onConflict: "id" });
    if (error) return { ok: false, message: dbMsg(error.message) };
    await audit(sb, input.id ? "product.update" : "product.create", `${input.name} (${id}), price ${input.price}`); refresh(); return { ok: true, id };
  } catch (e) { return fail(e); }
}
export async function deleteProduct(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("products").delete().eq("id", id); if (error) return { ok: false, message: error.message }; await audit(sb, "product.delete", id); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}
export async function setProductActive(id: string, active: boolean): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("products").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id); if (error) return { ok: false, message: error.message }; await audit(sb, active ? "product.activate" : "product.deactivate", id); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}
/** One-click: copies the 12 built-in demo products into the database (skips ones already there). */
export async function importDemoProducts(): Promise<Res> {
  try {
    const sb = await admin();
    const rows = getLocalProducts().map(p => ({ ...productToRow({ ...p, is_active: true }), rating: 0, review_count: 0, created_at: p.created_at }));
    const { error } = await sb.from("products").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) return { ok: false, message: dbMsg(error.message) };
    refresh(); return { ok: true, message: `${rows.length} demo products imported.` };
  } catch (e) { return fail(e); }
}

// ---------- Banners ----------
export interface BannerInput { id?: string; title: string; subtitle: string; button_text: string; button_link: string; image_url: string; sort_order: number; is_active: boolean; starts_at?: string | null; ends_at?: string | null; mobile_image_url?: string | null; image_alt?: string | null }
export async function saveBanner(b: BannerInput): Promise<Res> {
  try {
    const sb = await admin();
    if (!b.image_url) return { ok: false, message: "Please upload a banner image." };
    const day = (x?: string | null) => (x && /^\d{4}-\d{2}-\d{2}/.test(x) ? x.slice(0, 10) : "");
    const start = day(b.starts_at), end = day(b.ends_at); if (start && end && end < start) return { ok: false, message: "The end date is before the start date." };
    const mobile = String(b.mobile_image_url ?? "").trim(); if (mobile && /\.(mp4|webm)(\?|$)/i.test(mobile)) return { ok: false, message: "The phone picture must be an image (not a video)." };
    const base = { title: b.title.trim(), subtitle: b.subtitle.trim(), button_text: b.button_text.trim(), button_link: b.button_link.trim() || "/shop", image_url: b.image_url, sort_order: Math.floor(Number(b.sort_order) || 0), is_active: b.is_active };
    const extra = { starts_at: dayStart(start), ends_at: dayEnd(end), mobile_image_url: mobile || null, image_alt: String(b.image_alt ?? "").trim().slice(0, 160) || null };
    const run = (row: object) => b.id ? sb.from("banners").update(row).eq("id", b.id) : sb.from("banners").insert(row);
    let { error } = await run({ ...base, ...extra });
    if (error && /starts_at|ends_at|mobile_image_url|image_alt|schema cache/i.test(error.message)) {
      // The database does not have the new banner columns yet (migration-8). Plain banners still save; the new options need the migration.
      if (start || end || mobile || extra.image_alt) return { ok: false, message: "Dates, phone picture and picture description need a one-time database update. Open Supabase -> SQL Editor, run supabase/migration-8.sql, then save again." };
      ({ error } = await run(base));
    }
    if (error) return { ok: false, message: error.message }; refresh(); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteBanner(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("banners").delete().eq("id", id); if (error) return { ok: false, message: error.message }; refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

// ---------- Coupons ----------
export interface CouponInput { code: string; kind: "percent" | "amount"; value: number; min_subtotal?: number; usage_limit?: number; expires_at?: string; is_active: boolean; first_order_only?: boolean; isNew: boolean }
export async function saveCoupon(c: CouponInput): Promise<Res> {
  try {
    const sb = await admin();
    const code = c.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ""); if (!code) return { ok: false, message: "Enter a coupon code (letters / numbers)." };
    const v = Number(c.value); if (!(v > 0)) return { ok: false, message: "Discount value must be more than 0." }; if (c.kind === "percent" && v > 100) return { ok: false, message: "Percent cannot be more than 100." };
    const row = { code, percent_off: c.kind === "percent" ? v : null, amount_off: c.kind === "amount" ? v : null, min_subtotal: c.min_subtotal ? Number(c.min_subtotal) : null, usage_limit: c.usage_limit ? Math.floor(Number(c.usage_limit)) : null, expires_at: c.expires_at ? new Date(c.expires_at).toISOString() : null, is_active: c.is_active, first_order_only: Boolean(c.first_order_only) };
    const write = (r: Record<string, unknown>) => c.isNew ? sb.from("coupons").insert(r) : sb.from("coupons").update(r).eq("code", code);
    let { error } = await write(row);
    if (error && /first_order_only/.test(error.message)) { // migration-12 not run yet
      if (row.first_order_only) return { ok: false, message: "Run supabase/migration-12.sql in Supabase to use “First order only”." };
      const { first_order_only: _f, ...rest } = row; ({ error } = await write(rest));
    }
    if (error) return { ok: false, message: dbMsg(error.message) }; await audit(sb, c.isNew ? "coupon.create" : "coupon.update", `${code}: ${c.kind === "percent" ? v + "%" : "$" + v}${row.is_active ? "" : " (off)"}`); revalidatePath("/admin/coupons"); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteCoupon(code: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("coupons").delete().eq("code", code); if (error) return { ok: false, message: error.message }; await audit(sb, "coupon.delete", code); revalidatePath("/admin/coupons"); return { ok: true }; } catch (e) { return fail(e); }
}

// ---------- Orders ----------
const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"], PAYMENTS = ["unpaid", "paid", "refunded"];
type SB = ReturnType<typeof serverClient>;
/** Emails the customer about a status change. Never throws; returns a short note for the admin screen ("" when nothing to say). */
async function notifyCustomer(order: TemporaryOrder, to: string, status: string, tracking: string | null): Promise<string> {
  try {
    if (!["processing", "shipped", "delivered", "cancelled"].includes(status)) return "";
    if (!emailConfigured()) return "Customer email NOT sent: email is not set up yet.";
    const st = await getSiteSettings(); const mail = statusUpdate(brandOf(st), order, status, tracking);
    if (!mail) return "";
    const r = await sendEmail({ to, kind: "order_status", ...mail }); return r.ok ? "Email sent to the customer." : `Email could not be sent: ${r.error}`;
  } catch (e) { console.error("status email error:", e); return "Email could not be sent."; }
}
export async function updateOrder(id: string, v: { status: string; payment_status: string; notes: string; tracking_info?: string }): Promise<Res> {
  try {
    const sb = await admin();
    if (!STATUSES.includes(v.status) || !PAYMENTS.includes(v.payment_status)) return { ok: false, message: "Invalid status." };
    const { data: cur, error: curErr } = await sb.from("orders").select("status,payment_status,tracking_info,stock_restored,email,data").eq("id", id).maybeSingle();
    if (curErr) return { ok: false, message: dbMsg(curErr.message) };
    if (!cur) return { ok: false, message: "Order not found." };
    const was = cur.status as string, now = v.status, order = cur.data as TemporaryOrder; const notes: string[] = []; let restored = Boolean(cur.stock_restored);
    // Cancel before it ships -> stock goes back automatically. Undo the cancel -> stock is taken out again.
    if (now === "cancelled" && was !== "cancelled") {
      if ((was === "pending" || was === "processing") && !restored) { await adjustStock(sb, order.items ?? [], 1); restored = true; notes.push("Stock was put back in the shop."); }
      else if (was === "shipped" || was === "delivered") notes.push("The order had already shipped, so stock was NOT added back. Add it back yourself once the parcel returns.");
    } else if (was === "cancelled" && now !== "cancelled" && restored) { await adjustStock(sb, order.items ?? [], -1); restored = false; notes.push("Order re-opened: stock was taken out again."); }
    const tracking = (v.tracking_info ?? "").trim().slice(0, 300);
    const { error } = await sb.from("orders").update({ status: now, payment_status: v.payment_status, notes: v.notes.slice(0, 2000), tracking_info: tracking || null, stock_restored: restored }).eq("id", id);
    if (error) return { ok: false, message: dbMsg(error.message) };
    // Tell the customer when the status changes (or tracking is added on a shipped order).
    const statusChanged = now !== was, trackingChanged = tracking !== (cur.tracking_info ?? "");
    if (statusChanged || (now === "shipped" && trackingChanged)) { const n = await notifyCustomer(order, String(cur.email), now, tracking || null); if (n) notes.push(n); }
    await audit(sb, "order.update", `${id}: status ${was} → ${now}, payment ${cur.payment_status} → ${v.payment_status}`);
    revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); revalidatePath("/admin/products"); refresh();
    return { ok: true, message: ["Saved ✓", ...notes].join(" ") };
  } catch (e) { return fail(e); }
}

// ---------- Shipping labels (Shippo: USPS, UPS, FedEx) ----------
const parcelOk = (p: Parcel) => [p?.weight_oz, p?.l, p?.w, p?.h].every(n => Number.isFinite(Number(n)) && Number(n) > 0) && p.weight_oz <= 1120 && p.l <= 108 && p.w <= 108 && p.h <= 108;
async function loadOrder(sb: Awaited<ReturnType<typeof admin>>, id: string) {
  const { data } = await sb.from("orders").select("*").eq("id", id).maybeSingle(); if (!data) throw new Error("Order not found."); return data as any;
}
const destOf = (o: TemporaryOrder): ShipAddress => { const a = o.checkout.shipping_address; return { name: `${a.first_name} ${a.last_name}`.trim(), street1: a.address1, street2: a.address2 || undefined, city: a.city, state: stateCode(a.state) || a.state, zip: a.zip, country: "US", phone: o.checkout.contact.phone, email: o.checkout.contact.email }; };
/** Every carrier's price for this order's parcel, cheapest first (one row per service). */
export async function getLabelRates(orderId: string, parcel: Parcel): Promise<Res & { rates?: RateOption[] }> {
  try {
    const sb = await admin();
    if (!shippoConfigured()) return { ok: false, message: "Carrier rates are not connected yet. Add SHIPPO_API_KEY in Netlify (Environment variables) and redeploy." };
    if (!parcelOk(parcel)) return { ok: false, message: "Enter the package weight and the length, width and height (inches). Max 70 lb." };
    const from = shipFromOf(await getSettingsWithPrivate()); if (!from) return { ok: false, message: "Fill in your ship-from address in Settings first (street, city, state, ZIP)." };
    const row = await loadOrder(sb, orderId);
    const all = await getShippoRates(from, destOf(row.data as TemporaryOrder), { weight_oz: Number(parcel.weight_oz), l: Number(parcel.l), w: Number(parcel.w), h: Number(parcel.h) });
    const best = new Map<string, RateOption>(); for (const r of all) { const k = rateKey(r); const c = best.get(k); if (!c || r.amount < c.amount) best.set(k, r); }
    return { ok: true, rates: [...best.values()].sort((a, b) => a.amount - b.amount) };
  } catch (e) { return fail(e); }
}
/** Buys the label for the chosen rate, then saves carrier, tracking number and label link on the order. */
export async function buyLabel(orderId: string, rateId: string): Promise<Res> {
  try {
    const sb = await admin(); if (!shippoConfigured()) return { ok: false, message: "Carrier rates are not connected yet." };
    const row = await loadOrder(sb, orderId);
    if (row.label_url || row.tracking_number) return { ok: false, message: "This order already has a label or tracking number. Cancel the old label in Shippo first if you need a new one." };
    if (row.status === "cancelled") return { ok: false, message: "This order is cancelled." };
    const rate = await getShippoRate(String(rateId)); const label = await buyShippoLabel(String(rateId));
    const patch = { carrier: rate.carrier, tracking_number: label.tracking_number, tracking_url: label.tracking_url || trackingUrl(rate.carrier, label.tracking_number), label_url: label.label_url, label_cost: rate.amount, shipped_at: new Date().toISOString(), tracking_info: `${rate.carrier} ${label.tracking_number}`.trim(), ...(["pending", "processing"].includes(row.status) ? { status: "shipped" } : {}) };
    const { error } = await sb.from("orders").update(patch).eq("id", orderId);
    revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`);
    if (error) return { ok: false, message: `The label WAS bought (${rate.carrier} ${label.tracking_number}) but saving it on the order failed: ${dbMsg(error.message)} Label: ${label.label_url}` };
    await audit(sb, "order.label_bought", `${orderId}: ${rate.carrier} ${rate.service}, label cost $${rate.amount.toFixed(2)}`);
    const note = ["pending", "processing", "shipped"].includes(row.status) ? await notifyCustomer(row.data as TemporaryOrder, String(row.email), "shipped", patch.tracking_info) : "";
    return { ok: true, message: `Label bought: ${rate.carrier} ${rate.service}, $${rate.amount.toFixed(2)}.${note ? " " + note : ""}` };
  } catch (e) { return fail(e); }
}
/** For labels bought somewhere else (Pirate Ship, the post office...): save the tracking number by hand. */
export async function saveTracking(orderId: string, v: { carrier: string; tracking_number: string }): Promise<Res> {
  try {
    const sb = await admin(); const num = String(v.tracking_number ?? "").trim().slice(0, 60); const carrier = (CARRIERS as readonly string[]).includes(v.carrier) ? v.carrier : "Other";
    if (num.length < 6) return { ok: false, message: "Enter the tracking number." };
    const row = await loadOrder(sb, orderId);
    const { error } = await sb.from("orders").update({ carrier, tracking_number: num, tracking_url: trackingUrl(carrier, num) || null, shipped_at: row.shipped_at ?? new Date().toISOString(), tracking_info: `${carrier} ${num}`, ...(["pending", "processing"].includes(row.status) ? { status: "shipped" } : {}) }).eq("id", orderId);
    if (error) return { ok: false, message: dbMsg(error.message) };
    revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`);
    await audit(sb, "order.tracking_saved", `${orderId}: ${carrier} ${num}`);
    const note = ["pending", "processing", "shipped"].includes(row.status) ? await notifyCustomer(row.data as TemporaryOrder, String(row.email), "shipped", `${carrier} ${num}`) : "";
    return { ok: true, message: `Tracking saved. The customer can see it on Track Order.${note ? " " + note : ""}` };
  } catch (e) { return fail(e); }
}

// ---------- Offers to interested customers (eBay "Send offers") ----------
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => { let c = ""; for (let i = 0; i < 6; i++) c += CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]; return `OFFER-${c}`; };
export interface OfferInput { product_id: string; kind: "percent" | "amount"; value: number; days: number; message: string }
/** Emails each interested customer (who asked for offers and has not bought it) their own single-use code for this product. */
export async function sendOffers(o: OfferInput): Promise<Res> {
  try {
    const sb = await admin();
    if (!marketingEnabled()) return { ok: false, message: "Promotional emails are switched OFF (safety setting). They stay off until you have a verified business sending domain and customer consent. Nothing was sent." };
    if (!emailConfigured()) return { ok: false, message: "Email is not set up yet, so offers cannot be sent. See Settings → Email." };
    const value = Number(o.value), days = Math.floor(Number(o.days));
    if (!(value > 0) || (o.kind === "percent" && value > 90)) return { ok: false, message: o.kind === "percent" ? "Percent must be between 1 and 90." : "Enter a discount amount." };
    if (!(days >= 1 && days <= 60)) return { ok: false, message: "Choose how many days the offer lasts." };
    const message = (o.message ?? "").trim().slice(0, 230);
    const { data: prod } = await sb.from("products").select("id,name,slug").eq("id", o.product_id).maybeSingle(); if (!prod) return { ok: false, message: "Product not found." };
    const { data: subs } = await sb.from("offer_subscribers").select("email,token").eq("product_id", o.product_id).eq("unsubscribed", false);
    const { data: ords } = await sb.from("orders").select("email,status,data").neq("status", "cancelled").limit(3000);
    const bought = new Set((ords ?? []).filter(r => ((r.data as TemporaryOrder)?.items ?? []).some(i => i.product_id === o.product_id)).map(r => String(r.email).toLowerCase()));
    const eligible = (subs ?? []).filter(x => !bought.has(String(x.email).toLowerCase())).slice(0, 100);
    if (!eligible.length) return { ok: false, message: "Nobody is waiting for this product yet (or they already bought it)." };
    const expires = new Date(Date.now() + days * 86400000);
    const rows = eligible.map(x => ({ code: newCode(), percent_off: o.kind === "percent" ? value : null, amount_off: o.kind === "amount" ? value : null, product_id: o.product_id, usage_limit: 1, expires_at: expires.toISOString(), is_active: true, _to: x.email, _token: x.token }));
    const { error: ce } = await sb.from("coupons").insert(rows.map(({ _to, _token, ...c }) => c)); if (ce) return { ok: false, message: dbMsg(ce.message) };
    const st = await getSiteSettings(); const brand = brandOf(st); const exp = expires.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });
    const mails = rows.map(r => { const m = offerEmail(brand, { name: prod.name, slug: prod.slug, kind: o.kind, value, code: r.code, expires: exp, message, unsubscribeUrl: `${siteUrl()}/unsubscribe?t=${r._token}` }); return { to: r._to as string, ...m }; });
    const sent = await sendBatch(mails);
    if (!sent.ok) { await sb.from("coupons").delete().in("code", rows.map(r => r.code)); return { ok: false, message: `Emails could not be sent: ${sent.error}` }; }
    await sb.from("offers").insert({ product_id: o.product_id, kind: o.kind, value, days, message: message || null, sent_count: rows.length });
    await audit(sb, "offer.sent", `${prod.name}: ${o.kind === "percent" ? value + "%" : "$" + value} to ${rows.length} customers`);
    revalidatePath("/admin/offers"); revalidatePath("/admin/coupons");
    return { ok: true, message: `Offer sent to ${rows.length} customer${rows.length === 1 ? "" : "s"}.` };
  } catch (e) { return fail(e); }
}

// ---------- Store settings (contact info + social links) ----------
const cleanUrl = (u: string) => { const t = (u ?? "").trim(); if (!t) return ""; return /^https?:\/\//i.test(t) ? t.slice(0, 300) : `https://${t.slice(0, 300)}`; };
export async function saveSettings(v: SiteSettings): Promise<Res> {
  try {
    const sb = await admin();
    const money0 = (x: unknown, d: number) => { const n = Number(x); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : d; };
    const t = (x: unknown, n: number) => String(x ?? "").trim().slice(0, n);
    const stateIn = t(v.ship_state, 40), state = stateIn ? stateCode(stateIn) : "";
    if (stateIn && !state) return { ok: false, message: "Ship-from state: please use a US state like CA or California." };
    const zip = t(v.ship_zip, 10); if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) return { ok: false, message: "Ship-from ZIP must be 5 digits." };
    // Start from what is saved so fields managed elsewhere (Popup & Top bar) are never wiped by this form.
    const prev = await getSiteSettings();
    const data: SiteSettings = { ...prev, store_name: (v.store_name || "VEDAGLOW").trim().slice(0, 80), tagline: v.tagline.trim().slice(0, 120), email: v.email.trim().slice(0, 160), phone: v.phone.trim().slice(0, 40), whatsapp: v.whatsapp.trim().slice(0, 40),
      address: v.address.trim().slice(0, 300), hours: v.hours.trim().slice(0, 200), instagram: cleanUrl(v.instagram), facebook: cleanUrl(v.facebook), tiktok: cleanUrl(v.tiktok), youtube: cleanUrl(v.youtube),
      free_shipping_over: money0(v.free_shipping_over, 0), default_flat_rate: money0(v.default_flat_rate, 5.99), low_stock_at: Math.min(1000, Math.max(0, Math.floor(money0(v.low_stock_at, 5)))),
    };
    // The ship-from address is private: it goes to the admin-only table and is never written to the public settings row.
    const priv = { ship_name: t(v.ship_name, 80), ship_company: t(v.ship_company, 80), ship_street1: t(v.ship_street1, 120), ship_street2: t(v.ship_street2, 80), ship_city: t(v.ship_city, 80), ship_state: state, ship_zip: zip, ship_phone: t(v.ship_phone, 40) };
    const pubData = { ...data } as Record<string, unknown>; for (const k of PRIVATE_SETTING_KEYS) delete pubData[k];
    const { error: pe } = await sb.from("private_settings").upsert({ id: 1, data: priv }, { onConflict: "id" });
    if (pe) return { ok: false, message: "Could not save the private shipping address. Run supabase/migration-9.sql first. (" + pe.message + ")" };
    const { error } = await sb.from("site_settings").upsert({ id: 1, data: pubData }, { onConflict: "id" });
    if (error) return { ok: false, message: error.message }; await audit(sb, "settings.update", "Store settings saved"); refresh(); return { ok: true };
  } catch (e) { return fail(e); }
}

// ---------- Editable pages (About, Shipping, Returns, ...) ----------
export async function savePage(slug: string, title: string, body: string): Promise<Res> {
  try {
    const sb = await admin(); if (!isPageSlug(slug)) return { ok: false, message: "Unknown page." };
    if (!title.trim()) return { ok: false, message: "Title is required." };
    const { error } = await sb.from("pages").upsert({ slug, title: title.trim().slice(0, 120), body: body.slice(0, 40000), updated_at: new Date().toISOString() }, { onConflict: "slug" });
    if (error) return { ok: false, message: error.message }; refresh(); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function resetPage(slug: string): Promise<Res> {
  try { const sb = await admin(); if (!isPageSlug(slug)) return { ok: false, message: "Unknown page." }; const { error } = await sb.from("pages").delete().eq("slug", slug); if (error) return { ok: false, message: error.message }; refresh(); return { ok: true, message: DEFAULT_PAGES[slug].title }; } catch (e) { return fail(e); }
}

// ---------- FAQs (also power the chat assistant) ----------
export interface FaqInput { id?: string; question: string; answer: string; keywords: string; sort_order: number; is_active: boolean }
export async function saveFaq(f: FaqInput): Promise<Res> {
  try {
    const sb = await admin(); if (f.question.trim().length < 3 || f.answer.trim().length < 2) return { ok: false, message: "Enter a question and an answer." };
    const row = { question: f.question.trim().slice(0, 300), answer: f.answer.trim().slice(0, 3000), keywords: f.keywords.trim().slice(0, 300), sort_order: Math.floor(Number(f.sort_order) || 0), is_active: f.is_active };
    const { error } = f.id ? await sb.from("faqs").update(row).eq("id", f.id) : await sb.from("faqs").insert(row);
    if (error) return { ok: false, message: error.message }; refresh(); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteFaq(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("faqs").delete().eq("id", id); if (error) return { ok: false, message: error.message }; refresh(); return { ok: true }; } catch (e) { return fail(e); }
}
export async function loadDefaultFaqs(): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("faqs").insert(DEFAULT_FAQS.map((f, i) => ({ question: f.question, answer: f.answer, keywords: f.keywords, sort_order: i, is_active: true }))); if (error) return { ok: false, message: error.message }; refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

// ---------- Contact messages ----------
export async function setMessageRead(id: string, read: boolean): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("messages").update({ is_read: read }).eq("id", id); if (error) return { ok: false, message: error.message }; revalidatePath("/admin/messages"); return { ok: true }; } catch (e) { return fail(e); }
}
export async function deleteMessage(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("messages").delete().eq("id", id); if (error) return { ok: false, message: error.message }; revalidatePath("/admin/messages"); return { ok: true }; } catch (e) { return fail(e); }
}

// ---------- Deals (Buy 2 Get 1 Free, Buy 1 Get 1 Half Price, % off) ----------
export interface DealInput { id?: string; name: string; kind: "buy_get" | "percent"; buy_qty: number; get_qty: number; percent_off: number; product_ids: string[]; starts_on?: string; ends_on?: string; is_active: boolean }
// Dates are entered as plain days; a deal starts at 00:00 and ends at 23:59 Pacific time (USA).
const dayStart = (d?: string) => d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00-08:00`).toISOString() : null;
const dayEnd = (d?: string) => d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T23:59:59-08:00`).toISOString() : null;
export async function saveDeal(d: DealInput): Promise<Res> {
  try {
    const sb = await admin();
    const name = String(d.name ?? "").trim().slice(0, 80); if (!name) return { ok: false, message: "Give the deal a name (customers do not see it, it is for you)." };
    const kind = d.kind === "percent" ? "percent" : "buy_get";
    const pct = Number(d.percent_off); if (!(pct > 0 && pct <= 100)) return { ok: false, message: "Discount must be between 1 and 100 percent." };
    const buy = Math.floor(Number(d.buy_qty)), get = Math.floor(Number(d.get_qty));
    if (kind === "buy_get" && !(buy >= 1 && buy <= 20 && get >= 1 && get <= 20)) return { ok: false, message: "Buy and Get quantities must be between 1 and 20." };
    const ids = Array.isArray(d.product_ids) ? [...new Set(d.product_ids.map(x => String(x).slice(0, 80)))].slice(0, 500) : [];
    const starts_at = dayStart(d.starts_on), ends_at = dayEnd(d.ends_on);
    if (starts_at && ends_at && ends_at < starts_at) return { ok: false, message: "The end date is before the start date." };
    const row = { name, kind, buy_qty: kind === "buy_get" ? buy : 1, get_qty: kind === "buy_get" ? get : 1, percent_off: pct, product_ids: ids, starts_at, ends_at, is_active: !!d.is_active };
    const { error } = d.id ? await sb.from("deals").update(row).eq("id", d.id) : await sb.from("deals").insert(row);
    if (error) return { ok: false, message: dbMsg(error.message) }; await audit(sb, d.id ? "deal.update" : "deal.create", `${name}: ${kind === "percent" ? pct + "% off" : `buy ${buy} get ${get} at ${pct}% off`}${row.is_active ? "" : " (off)"}`); refresh(); revalidatePath("/admin/deals"); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function setDealActive(id: string, active: boolean): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("deals").update({ is_active: active }).eq("id", id); if (error) return { ok: false, message: dbMsg(error.message) }; await audit(sb, active ? "deal.on" : "deal.off", id); refresh(); revalidatePath("/admin/deals"); return { ok: true }; } catch (e) { return fail(e); }
}
export async function deleteDeal(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("deals").delete().eq("id", id); if (error) return { ok: false, message: dbMsg(error.message) }; await audit(sb, "deal.delete", id); refresh(); revalidatePath("/admin/deals"); return { ok: true }; } catch (e) { return fail(e); }
}

// ---------- Top bar message + sale pop-up ----------
export interface PromoInput { topbar_text: string; topbar_show_shipping: boolean; popup_enabled: boolean; popup_title: string; popup_message: string; popup_code: string; popup_button_text: string; popup_button_link: string; popup_delay: number; newsletter_title: string; newsletter_text: string; newsletter_code: string; topbar_bg?: string; topbar_link?: string; topbar_starts?: string; topbar_ends?: string }
export async function savePromo(v: PromoInput): Promise<Res> {
  try {
    const sb = await admin(); const t = (x: unknown, n: number) => String(x ?? "").trim().slice(0, n);
    const link = t(v.popup_button_link, 300); if (link && !/^(\/|https?:\/\/)/i.test(link)) return { ok: false, message: "Button link must start with / (like /shop) or https://" };
    const delay = Math.min(60, Math.max(0, Math.round(Number(v.popup_delay) || 0)));
    if (v.popup_enabled && !t(v.popup_title, 80) && !t(v.popup_message, 400)) return { ok: false, message: "Write a title or a message for the pop-up first." };
    const bg = t(v.topbar_bg, 7); if (bg && !isHex(bg)) return { ok: false, message: "Top bar colour must look like #0F3D26." };
    if (bg && contrast(bg, "#ffffff") < 3 && contrast(bg, "#1F2A22") < 3) return { ok: false, message: "That top bar colour makes the text hard to read. Pick a clearer colour." };
    const tl = t(v.topbar_link, 300); if (tl && !safeLink(tl)) return { ok: false, message: "Top bar link must start with / (like /sale) or https://" };
    const day = (x: unknown) => { const y = t(x, 10); return /^\d{4}-\d{2}-\d{2}$/.test(y) ? y : ""; };
    const ts = day(v.topbar_starts), te = day(v.topbar_ends); if (ts && te && te < ts) return { ok: false, message: "The top bar end date is before the start date." };
    const lines = topbarLines(v.topbar_text).map(x => x.slice(0, 120)).join("\n");
    const prev = await getSiteSettings();
    const data: SiteSettings = { ...prev, topbar_bg: bg, topbar_link: tl, topbar_starts: ts, topbar_ends: te, topbar_text: lines, topbar_show_shipping: !!v.topbar_show_shipping, popup_enabled: !!v.popup_enabled, popup_title: t(v.popup_title, 80), popup_message: t(v.popup_message, 400),
      popup_code: t(v.popup_code, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, ""), popup_button_text: t(v.popup_button_text, 30) || "Shop now", popup_button_link: link || "/shop", popup_delay: delay,
      newsletter_title: t(v.newsletter_title, 80) || "Subscribe & get news and offers.", newsletter_text: t(v.newsletter_text, 200), newsletter_code: t(v.newsletter_code, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, "") };
    const { error } = await sb.from("site_settings").upsert({ id: 1, data }, { onConflict: "id" });
    if (error) return { ok: false, message: error.message }; await audit(sb, "promo.update", `Top bar / pop-up saved (pop-up ${data.popup_enabled ? "on" : "off"})`); refresh(); revalidatePath("/admin/promo"); return { ok: true };
  } catch (e) { return fail(e); }
}

// ---------- Test orders (left out of sales numbers) ----------
export async function setOrderTest(id: string, isTest: boolean): Promise<Res> {
  try {
    const sb = await admin(); const { error } = await sb.from("orders").update({ is_test: !!isTest }).eq("id", String(id));
    if (error) return { ok: false, message: dbMsg(error.message) };
    await audit(sb, isTest ? "order.mark_test" : "order.unmark_test", String(id)); revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); return { ok: true };
  } catch (e) { return fail(e); }
}

// ---------- Categories ----------
export interface CategoryInput { id?: string; name: string; slug: string; blurb: string; image_url?: string; sort_order: number; is_active: boolean; seo_title?: string; seo_description?: string }
const RESERVED_SLUGS = ["new-arrivals", "sale", "shop"];
export async function saveCategory(c: CategoryInput): Promise<Res> {
  try {
    const sb = await admin(); const name = String(c.name ?? "").trim().slice(0, 60); if (!name) return { ok: false, message: "Give the category a name." };
    const slug = slugify(c.slug || name).slice(0, 60); if (!slug) return { ok: false, message: "The URL name is empty." }; if (RESERVED_SLUGS.includes(slug)) return { ok: false, message: `“${slug}” is used by the shop itself. Choose another URL name.` };
    const img = String(c.image_url ?? "").trim(); if (img && !/^https:\/\/\S+$/i.test(img)) return { ok: false, message: "The image must be a https:// link (use the upload button)." };
    const row = { name, slug, blurb: String(c.blurb ?? "").trim().slice(0, 300), image_url: img || null, sort_order: Math.max(0, Math.min(9999, Math.floor(Number(c.sort_order) || 0))), is_active: !!c.is_active, seo_title: String(c.seo_title ?? "").trim().slice(0, 120) || null, seo_description: String(c.seo_description ?? "").trim().slice(0, 320) || null };
    if (c.id) {
      const { data: old } = await sb.from("categories").select("slug").eq("id", c.id).maybeSingle(); if (!old) return { ok: false, message: "Category not found." };
      const { error } = await sb.from("categories").update(row).eq("id", c.id); if (error) return { ok: false, message: dbMsg(error.message) };
      // products point to the category by its URL name: keep them attached when it is renamed
      if (old.slug !== slug) await sb.from("products").update({ category: slug, updated_at: new Date().toISOString() }).eq("category", old.slug);
    } else { const { error } = await sb.from("categories").insert(row); if (error) return { ok: false, message: dbMsg(error.message) }; }
    await audit(sb, c.id ? "category.update" : "category.create", `${name} (${slug})${row.is_active ? "" : " (off)"}`); refresh(); revalidatePath("/admin/categories"); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteCategory(id: string): Promise<Res> {
  try {
    const sb = await admin(); const { data: c } = await sb.from("categories").select("slug,name").eq("id", id).maybeSingle(); if (!c) return { ok: false, message: "Category not found." };
    const { count } = await sb.from("products").select("id", { count: "exact", head: true }).eq("category", c.slug);
    if ((count ?? 0) > 0) return { ok: false, message: `${count} product${count === 1 ? " is" : "s are"} still in “${c.name}”. Move them to another category first, or just switch the category off instead of deleting it.` };
    const { error } = await sb.from("categories").delete().eq("id", id); if (error) return { ok: false, message: dbMsg(error.message) };
    await audit(sb, "category.delete", `${c.name} (${c.slug})`); refresh(); revalidatePath("/admin/categories"); return { ok: true };
  } catch (e) { return fail(e); }
}
/** Swaps the display order with the neighbour above (-1) or below (+1). */
export async function moveCategory(id: string, dir: -1 | 1): Promise<Res> {
  try {
    const sb = await admin(); const { data } = await sb.from("categories").select("id,sort_order,name").order("sort_order").order("name"); const list = data ?? [];
    const i = list.findIndex(x => x.id === id), j = i + dir; if (i < 0 || j < 0 || j >= list.length) return { ok: true };
    const order = list.map(x => x.id); [order[i], order[j]] = [order[j], order[i]];
    for (let k = 0; k < order.length; k++) await sb.from("categories").update({ sort_order: (k + 1) * 10 }).eq("id", order[k]); // renumber so ties never happen
    refresh(); revalidatePath("/admin/categories"); return { ok: true };
  } catch (e) { return fail(e); }
}
/** Copies the five built-in categories into the database so they can be edited. */
export async function seedCategories(): Promise<Res> {
  try {
    const sb = await admin(); const { error } = await sb.from("categories").upsert(DEFAULT_CATEGORIES.map(c => ({ slug: c.slug, name: c.name, blurb: c.blurb, sort_order: c.sort_order, is_active: true })), { onConflict: "slug", ignoreDuplicates: true });
    if (error) return { ok: false, message: dbMsg(error.message) }; await audit(sb, "category.seed", "Built-in categories saved to the database"); refresh(); revalidatePath("/admin/categories"); return { ok: true };
  } catch (e) { return fail(e); }
}

// ---------- Bulk edit (products ticked in the list) ----------
export type BulkAction = { type: "visible" | "hidden" } | { type: "category"; value: string } | { type: "price_percent"; value: number } | { type: "stock_set" | "stock_add"; value: number } | { type: "tag_add" | "tag_remove"; value: string };
export async function bulkUpdateProducts(ids: string[], a: BulkAction): Promise<Res> {
  try {
    const sb = await admin(); const list = [...new Set((Array.isArray(ids) ? ids : []).map(String))].slice(0, 500); if (!list.length) return { ok: false, message: "Tick at least one product first." };
    if ((a.type === "tag_add" || a.type === "tag_remove") && !(TAGS as readonly string[]).includes(a.value)) return { ok: false, message: "Unknown tag." };
    if (a.type === "price_percent" && !(Number.isFinite(a.value) && a.value >= -90 && a.value <= 500 && a.value !== 0)) return { ok: false, message: "Percent must be between -90 and 500 (not 0)." };
    if ((a.type === "stock_set" || a.type === "stock_add") && !(Number.isInteger(a.value) && Math.abs(a.value) <= 100000 && (a.type === "stock_add" || a.value >= 0))) return { ok: false, message: "Stock must be a whole number." };
    if (a.type === "category") { const { data: cs } = await sb.from("categories").select("slug"); const ok = new Set([...(cs ?? []).map(c => c.slug), ...(((cs ?? []).length ? [] : DEFAULT_CATEGORIES.map(c => c.slug)))]); if (!ok.has(a.value)) return { ok: false, message: "That category does not exist." }; }
    const { data: rows, error } = await sb.from("products").select("id,price,compare_at_price,stock,tags,variants").in("id", list); if (error) return { ok: false, message: dbMsg(error.message) };
    let changed = 0; const skipped: string[] = []; const now = new Date().toISOString();
    for (const r of rows ?? []) {
      const hasVar = Array.isArray(r.variants) && r.variants.length > 0; let patch: Record<string, unknown> | null = null;
      switch (a.type) {
        case "visible": patch = { is_active: true }; break; case "hidden": patch = { is_active: false }; break; case "category": patch = { category: a.value }; break;
        case "price_percent": { if (hasVar) { skipped.push(r.id); break; } const np = Math.round(Number(r.price) * (1 + a.value / 100) * 100) / 100; if (!(np > 0)) { skipped.push(r.id); break; } patch = { price: np, ...(r.compare_at_price != null && Number(r.compare_at_price) <= np ? { compare_at_price: null } : {}) }; break; }
        case "stock_set": case "stock_add": { if (hasVar) { skipped.push(r.id); break; } const ns = a.type === "stock_set" ? a.value : Math.max(0, Number(r.stock) + a.value); patch = { stock: ns }; break; }
        case "tag_add": patch = { tags: [...new Set([...(r.tags ?? []), a.value])] }; break; case "tag_remove": patch = { tags: (r.tags ?? []).filter((t: string) => t !== a.value) }; break;
      }
      if (!patch) continue; const { error: e2 } = await sb.from("products").update({ ...patch, updated_at: now }).eq("id", r.id); if (e2) return { ok: false, message: `${changed} changed, then stopped: ${dbMsg(e2.message)}` }; changed++;
    }
    await audit(sb, "product.bulk_edit", `${a.type}${"value" in a ? " " + a.value : ""}: ${changed} products${skipped.length ? `, ${skipped.length} skipped (variations or price below 0)` : ""}`); refresh(); revalidatePath("/admin/products");
    return { ok: true, message: `${changed} product${changed === 1 ? "" : "s"} updated.${skipped.length ? ` ${skipped.length} skipped (they have variations, or the new price would be 0 or less).` : ""}` };
  } catch (e) { return fail(e); }
}

// ---------- CSV import (checked first, written only after you confirm) ----------
type ImportCtx = { existing: Existing[]; cats: string[] };
async function importCtx(sb: Awaited<ReturnType<typeof admin>>): Promise<ImportCtx> {
  const [{ data: ps }, { data: cs }] = await Promise.all([sb.from("products").select("id,slug,sku,variants").limit(5000), sb.from("categories").select("slug")]);
  return { existing: (ps ?? []).map(p => ({ id: p.id, slug: p.slug, sku: p.sku, hasVariants: Array.isArray(p.variants) && p.variants.length > 0 })), cats: (cs ?? []).length ? (cs ?? []).map(c => c.slug) : DEFAULT_CATEGORIES.map(c => c.slug) };
}
export interface ImportPreview { ok: boolean; message?: string; summary?: { create: number; update: number; skip: number; error: number }; problems?: { line: number; name: string; action: string; text: string }[]; unknown?: string[] }
const view = (results: RowResult[]) => results.filter(r => r.action !== "create" || r.messages.length).slice(0, 60).map(r => ({ line: r.line, name: r.name, action: r.action, text: [r.note, ...r.messages].filter(Boolean).join(" ") }));
export async function previewProductImport(table: string[][], updateExisting: boolean): Promise<ImportPreview> {
  try {
    const sb = await admin(); const ctx = await importCtx(sb); const t = (Array.isArray(table) ? table : []).slice(0, 600).map(r => (Array.isArray(r) ? r : []).slice(0, 40).map(x => String(x ?? "").slice(0, 9000)));
    const v = validateImport(t, ctx.existing, ctx.cats, !!updateExisting); if (v.fileError) return { ok: false, message: v.fileError, unknown: v.unknown };
    return { ok: true, summary: summarize(v.results), problems: view(v.results), unknown: v.unknown };
  } catch (e) { const r = fail(e); return { ok: false, message: r.message }; }
}
export async function commitProductImport(table: string[][], updateExisting: boolean): Promise<Res> {
  try {
    const sb = await admin(); const ctx = await importCtx(sb); const t = (Array.isArray(table) ? table : []).slice(0, 600).map(r => (Array.isArray(r) ? r : []).slice(0, 40).map(x => String(x ?? "").slice(0, 9000)));
    const v = validateImport(t, ctx.existing, ctx.cats, !!updateExisting); if (v.fileError) return { ok: false, message: v.fileError };
    const bad = v.results.filter(r => r.action === "error"); if (bad.length) return { ok: false, message: `${bad.length} row${bad.length === 1 ? " has" : "s have"} errors. Nothing was imported. Fix them and try again.` };
    const now = new Date().toISOString(); let created = 0, updated = 0;
    for (const r of v.results) {
      if (!r.patch) continue;
      if (r.action === "create") {
        const p = r.patch; const id = `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        const row = productToRow({ id, slug: p.slug!, name: p.name!, short_description: p.short_description ?? "", description: p.description ?? undefined, brand: p.brand ?? undefined, sku: p.sku ?? undefined, category: p.category!, price: p.price!, compare_at_price: p.compare_at_price ?? undefined, images: p.images ?? [], visual: { kind: "bottle", label: "", color: "#E9D2B4" }, tags: (p.tags ?? []) as any, stock: p.stock ?? 0, is_active: p.is_active ?? false, seo_title: p.seo_title ?? undefined, seo_description: p.seo_description ?? undefined, gtin: p.gtin ?? undefined, mpn: p.mpn ?? undefined, shipping_mode: "flat" });
        const { error } = await sb.from("products").insert(row); if (error) return { ok: false, message: `${created} created, then stopped at line ${r.line}: ${dbMsg(error.message)}` }; created++;
      } else if (r.action === "update" && r.existingId) {
        const { error } = await sb.from("products").update({ ...r.patch, updated_at: now }).eq("id", r.existingId); if (error) return { ok: false, message: `${created} created, ${updated} updated, then stopped at line ${r.line}: ${dbMsg(error.message)}` }; updated++;
      }
    }
    const skipped = v.results.filter(r => r.action === "skip").length;
    await audit(sb, "product.csv_import", `${created} created, ${updated} updated, ${skipped} skipped`); refresh(); revalidatePath("/admin/products");
    return { ok: true, message: `Import finished: ${created} created${created ? " (as hidden drafts unless the file said yes)" : ""}, ${updated} updated, ${skipped} skipped.` };
  } catch (e) { return fail(e); }
}

// ---------- Reviews (moderation) ----------
export async function setReviewStatus(id: string, status: "approved" | "rejected" | "pending"): Promise<Res> {
  try {
    if (!["approved", "rejected", "pending"].includes(status)) return { ok: false, message: "Unknown status." };
    const sb = await admin(); const { error } = await sb.from("reviews").update({ status }).eq("id", String(id)); if (error) return { ok: false, message: dbMsg(error.message) };
    await audit(sb, `review.${status}`, String(id)); refresh(); revalidatePath("/admin/reviews"); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function replyReview(id: string, text: string): Promise<Res> {
  try {
    const sb = await admin(); const t = String(text ?? "").trim().slice(0, 600); const { error } = await sb.from("reviews").update({ admin_reply: t || null }).eq("id", String(id)); if (error) return { ok: false, message: dbMsg(error.message) };
    await audit(sb, "review.reply", String(id)); refresh(); revalidatePath("/admin/reviews"); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteReview(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("reviews").delete().eq("id", String(id)); if (error) return { ok: false, message: dbMsg(error.message) }; await audit(sb, "review.delete", String(id)); refresh(); revalidatePath("/admin/reviews"); return { ok: true }; } catch (e) { return fail(e); }
}


// ---------- Brand & Logo ----------
export interface BrandInput { logo_url: string; logo_alt: string; logo_size: "s" | "m" | "l"; color_primary: string; color_accent: string; color_bg: string }
export async function saveBrand(v: BrandInput): Promise<Res> {
  try {
    const sb = await admin(); const t = (x: unknown, n: number) => String(x ?? "").trim().slice(0, n);
    const logo = t(v.logo_url, 600); if (logo && !/^https:\/\//i.test(logo)) return { ok: false, message: "The logo must be an uploaded picture (or an https:// address)." };
    const cols = [t(v.color_primary, 7), t(v.color_accent, 7), t(v.color_bg, 7)];
    for (const c of cols) if (c && !isHex(c)) return { ok: false, message: "Colours must look like #0F3D26." };
    const bad = colorIssues(cols[0], cols[1], cols[2]).find(i => i.level === "block"); if (bad) return { ok: false, message: bad.text };
    const size = v.logo_size === "s" || v.logo_size === "l" ? v.logo_size : "m";
    const prev = await getSiteSettings();
    const data: SiteSettings = { ...prev, logo_url: logo, logo_alt: t(v.logo_alt, 120), logo_size: size, color_primary: cols[0], color_accent: cols[1], color_bg: cols[2] };
    const { error } = await sb.from("site_settings").upsert({ id: 1, data }, { onConflict: "id" });
    if (error) return { ok: false, message: error.message };
    await audit(sb, "brand.update", `Brand saved (${logo ? "custom logo" : "original logo"}, ${cols.some(Boolean) ? "custom colours" : "original colours"})`); refresh(); revalidatePath("/admin/brand"); return { ok: true };
  } catch (e) { return fail(e); }
}

// ---------- Homepage sections ----------
export async function saveHomepage(rows: { key: string; on: boolean; title?: string; count?: number }[]): Promise<Res> {
  try {
    const sb = await admin();
    const list = homeSectionsOf({ home_sections: Array.isArray(rows) ? rows : [] });
    if (!list.some(r => r.on)) return { ok: false, message: "Keep at least one section switched on." };
    const prev = await getSiteSettings();
    const data: SiteSettings = { ...prev, home_sections: list };
    const { error } = await sb.from("site_settings").upsert({ id: 1, data }, { onConflict: "id" });
    if (error) return { ok: false, message: error.message };
    await audit(sb, "homepage.update", list.map(r => (r.on ? "" : "-") + r.key).join(", ")); refresh(); revalidatePath("/admin/homepage"); return { ok: true };
  } catch (e) { return fail(e); }
}

// ---------- Google & Analytics ----------
export async function saveGoogle(v: { ga_id: string; google_verify: string; meta_pixel_id?: string }): Promise<Res> {
  try {
    const sb = await admin(); const rawGa = String(v.ga_id ?? "").trim(), rawVer = String(v.google_verify ?? "").trim();
    const ga = gaId(rawGa); if (rawGa && !ga) return { ok: false, message: "The Analytics ID looks like G-ABC123XYZ (starts with G-). Copy it from Google Analytics -> Admin -> Data streams." };
    const ver = verifyToken(rawVer); if (rawVer && !ver) return { ok: false, message: "That verification code does not look right. Paste only the code (or the whole meta tag) from Google Search Console." };
    const rawPx = String(v.meta_pixel_id ?? "").trim(), px = pixelId(rawPx); if (rawPx && !px) return { ok: false, message: "The Meta Pixel ID is a number of 15-16 digits (Meta Events Manager -> Data sources)." };
    const prev = await getSiteSettings(); const data: SiteSettings = { ...prev, ga_id: ga, google_verify: ver, meta_pixel_id: px };
    const { error } = await sb.from("site_settings").upsert({ id: 1, data }, { onConflict: "id" });
    if (error) return { ok: false, message: error.message };
    await audit(sb, "google.update", `Analytics ${ga ? "on" : "off"}, Meta Pixel ${px ? "on" : "off"}, Search Console ${ver ? "set" : "not set"}`); refresh(); revalidatePath("/admin/google"); return { ok: true };
  } catch (e) { return fail(e); }
}

// ---------- Card payments (Stripe) ----------
export async function testStripe(): Promise<Res> { try { await admin(); const r = await checkConnection(); return { ok: r.ok, message: r.message }; } catch (e) { return fail(e); } }
/** Gives the customer their money back (full amount) through Stripe, then marks the order Refunded. Stock is NOT touched: cancel the order for that. */
export async function refundOrder(id: string): Promise<Res> {
  try {
    const sb = await admin();
    const { data: row, error } = await sb.from("orders").select("payment_status,data").eq("id", id).maybeSingle();
    if (error) return { ok: false, message: dbMsg(error.message) }; if (!row) return { ok: false, message: "Order not found." };
    if (row.payment_status !== "paid") return { ok: false, message: "Only a paid order can be refunded." };
    const o = row.data as TemporaryOrder; const pi = o.payment?.payment_intent;
    if (!pi) return { ok: false, message: "This order was not paid through Stripe here. Refund it where you took the money, then set Payment to Refunded." };
    const r = await refundPayment(pi, id); if (!r.ok) return { ok: false, message: r.message ?? "Stripe did not accept the refund." };
    const { data: fresh } = await sb.from("orders").select("email,data").eq("id", id).maybeSingle(); const o2 = (fresh?.data as TemporaryOrder) ?? o; let mailed = Boolean(o2.payment?.refund_emailed);
    if (!mailed && emailConfigured() && fresh?.email) { try { const st = await getSiteSettings(); const mm = refundEmail(brandOf(st), o2); mailed = (await sendEmail({ to: String(fresh.email), kind: "refund", dedupeKey: `refund:${id}`, orderId: id, ...mm })).ok; const rn = st.refund_notify_email || notifyEmail(st); if (rn) await sendEmail({ to: rn, kind: "refund_admin", dedupeKey: `refund_admin:${id}`, orderId: id, ...refundNoticeAdmin(brandOf(st), o2) }); } catch { /* ignore */ } }
    const { error: e2 } = await sb.from("orders").update({ payment_status: "refunded", data: { ...o2, payment: { ...o2.payment!, refunded_at: o2.payment?.refunded_at ?? new Date().toISOString(), refund_emailed: mailed } } }).eq("id", id);
    if (e2) return { ok: false, message: "Stripe refunded the money, but saving failed: set Payment to Refunded by hand. " + dbMsg(e2.message) };
    await audit(sb, "order.refund", `${id}: full refund $${o.summary.total.toFixed(2)}`); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); revalidatePath("/admin");
    return { ok: true, message: "Refunded. The customer sees it in 5-10 days." };
  } catch (e) { return fail(e); }
}

// ---------- Customers (CRM notes, private) ----------
export async function saveCustomerNote(email: string, note: string, tags: string): Promise<Res> {
  try {
    const sb = await admin(); const em = String(email ?? "").trim().toLowerCase().slice(0, 160); if (!em.includes("@")) return { ok: false, message: "Invalid customer." };
    const t = String(tags ?? "").split(",").map(x => x.trim().toLowerCase().replace(/[^a-z0-9 _-]/g, "").slice(0, 24)).filter(Boolean).slice(0, 10);
    const { error } = await sb.from("customer_notes").upsert({ email: em, note: String(note ?? "").slice(0, 4000), tags: t, updated_at: new Date().toISOString() });
    if (error) return { ok: false, message: /customer_notes/.test(error.message) ? "Run supabase/migration-10.sql in Supabase first." : error.message };
    await audit(sb, "customer.note", em); revalidatePath(`/admin/customers/${encodeURIComponent(em)}`);
    return { ok: true, message: "Saved ✓" };
  } catch (e) { return fail(e); }
}

// ---------- Email status + test ----------
/** Sends a test email to the signed-in admin's own address only. */
export async function sendTestEmail(): Promise<Res> {
  try {
    const sb = await admin(); const { data: { user } } = await sb.auth.getUser(); if (!user?.email) return { ok: false, message: "Your admin account has no email." };
    if (!emailConfigured()) return { ok: false, message: "Email is not set up yet (RESEND_API_KEY is missing)." };
    const st = await getSiteSettings(); const r = await sendEmail({ to: user.email, kind: "test", ...testEmail(brandOf(st)) });
    await audit(sb, "email.test", user.email); revalidatePath("/admin/emails");
    return r.ok ? { ok: true, message: `Test email sent to ${user.email}. Check your inbox (and spam).` } : { ok: false, message: r.error ?? "Could not send." };
  } catch (e) { return fail(e); }
}

// ---------- Inventory ----------
/** Sets the real stock count for a product (or one option of it). Logged with the reason; safe against simultaneous sales (row lock in the database). */
export async function setStock(productId: string, variantId: string, qty: number, reason: string): Promise<Res> {
  try {
    const sb = await admin(); const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n < 0 || n > 100000) return { ok: false, message: "Enter a whole number from 0 to 100000." };
    const { data, error } = await sb.rpc("set_stock", { p_product: String(productId).slice(0, 80), p_variant: String(variantId ?? "").slice(0, 80), p_qty: n, p_reason: String(reason ?? "").trim().slice(0, 200) });
    if (error) return { ok: false, message: /set_stock/.test(error.message) && /function/i.test(error.message) ? "Run supabase/migration-12.sql in Supabase first." : /variant_required/.test(error.message) ? "Choose which option to change." : error.message };
    await audit(sb, "stock.set", `${productId}${variantId ? "/" + variantId : ""}: ${(data as any)?.before} → ${n}${reason ? " (" + String(reason).slice(0, 60) + ")" : ""}`);
    revalidatePath("/admin/inventory"); revalidatePath("/admin/products"); revalidatePath("/admin"); refresh();
    return { ok: true, message: "Saved ✓" };
  } catch (e) { return fail(e); }
}

// ---------- AI Product Creator (suggests only; the owner decides) ----------
const utcDayStart = () => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d.toISOString(); };
export async function generateProductDraft(input: { image_base64: string; mime: string; price: number; notes?: string; urls?: string; category_options: string[] }): Promise<Res & { draft?: AiDraft; needs?: string[]; warnings?: string[]; left?: number }> {
  try {
    const sb = await admin(); const cfg = aiConfig(); if (!cfg) return { ok: false, message: "AI is not connected yet. Add the provider key in Netlify (see Admin → AI Product Creator). You can still create the product by hand." };
    const price = Number(input.price); if (!(price > 0) || price > 100000) return { ok: false, message: "Enter the selling price first." };
    if (!["image/webp", "image/jpeg", "image/png"].includes(input.mime)) return { ok: false, message: "Use a JPG, PNG or WebP photo." };
    const b64 = String(input.image_base64 ?? ""); if (!/^[A-Za-z0-9+/=]+$/.test(b64) || b64.length < 100 || b64.length > 1_800_000) return { ok: false, message: "The photo is missing or too large. Try a smaller photo." };
    const cats = (input.category_options ?? []).map(String).filter(c => /^[a-z0-9-]{1,60}$/.test(c)).slice(0, 40); if (!cats.length) return { ok: false, message: "No categories found. Add a category first." };
    const { count } = await sb.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", utcDayStart());
    const used = count ?? 0; if (used >= cfg.dailyLimit) return { ok: false, message: `Daily AI limit reached (${cfg.dailyLimit} per day). It resets at midnight UTC. Change AI_DAILY_LIMIT in Netlify if you want more.`, left: 0 };
    const { data: { user } } = await sb.auth.getUser(); const urls = cleanUrls(input.urls ?? "");
    const r = await generate(cfg, SYSTEM_PROMPT, userPrompt({ categories: cats, notes: input.notes, urls }), { mime: input.mime as "image/webp", base64: b64 });
    await sb.from("ai_usage").insert({ provider: cfg.provider, model: cfg.model, ok: r.ok, input_tokens: r.inputTokens ?? null, output_tokens: r.outputTokens ?? null, error: r.ok ? null : (r.error ?? "").slice(0, 300), by_email: user?.email ?? null });
    if (!r.ok) return { ok: false, message: r.error ?? "The AI could not answer.", left: Math.max(0, cfg.dailyLimit - used - 1) };
    const d = parseDraft(r.text ?? "", cats); const left = Math.max(0, cfg.dailyLimit - used - 1);
    if (!d.ok) return { ok: false, message: d.error, left };
    await audit(sb, "ai.draft", `${d.draft!.name} via ${cfg.provider}`); return { ok: true, draft: d.draft, needs: d.needs, warnings: d.warnings, left };
  } catch (e) { return fail(e); }
}
export async function createAiProduct(input: { draft: AiDraft; price: number; images: string[]; thumb?: string; publish: boolean; acknowledged: boolean; notes?: string; urls?: string; needs: string[] }): Promise<Res> {
  try {
    const sb = await admin(); const d = input.draft; const price = Math.round(Number(input.price) * 100) / 100;
    if (!d?.name?.trim()) return { ok: false, message: "Product name is required." }; if (!(price > 0)) return { ok: false, message: "Enter a valid price." };
    const images = (input.images ?? []).filter(u => typeof u === "string" && /^https:\/\//.test(u)).slice(0, 8); if (!images.length) return { ok: false, message: "Add the photo first." };
    // Publishing is only possible after the owner confirms the checklist. Checked again here on the server (the browser is not trusted).
    const stillNeeds = SENSITIVE.filter(f => !String((d as any)[f] ?? "").trim()); const claims = scanClaims([d.name, d.short_description, d.description, d.benefits, d.seo_title, d.seo_description].join(" \n "));
    if (input.publish && (stillNeeds.length || claims.length) && !input.acknowledged) return { ok: false, message: `Not published: confirm the checklist first (${[...stillNeeds.map(f => f.replace(/_/g, " ") + " is empty"), ...claims.map(c => "wording: " + c)].join("; ")}).` };
    const base = slugify(d.name); let slug = base; const { data: clash } = await sb.from("products").select("slug").like("slug", `${base}%`).limit(50); const taken = new Set((clash ?? []).map(r => r.slug)); for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    const seo = autoSeoFor(d);
    const p: ProductInput = { id: "", slug, name: d.name.trim().slice(0, 120), brand: d.brand || undefined, product_type: d.product_type || undefined, category: d.category as ProductInput["category"], short_description: d.short_description, description: d.description || undefined, ingredients: d.ingredients || undefined, how_to_use: d.how_to_use || undefined, benefits: d.benefits || undefined, size_quantity: d.size_quantity || undefined, suitable_for: d.suitable_for || undefined,
      price, images, visual: { kind: "bottle", label: "", color: "#E9D2B4" }, tags: [], stock: 0, is_active: Boolean(input.publish), sort_priority: 0, condition: "New", specifics: [], seo_title: d.seo_title || seo.title, seo_description: d.seo_description || seo.description, seo_keywords: d.seo_keywords || seo.keywords };
    const r = await saveProduct(p); if (!r.ok) return r;
    const { data: { user } } = await sb.auth.getUser(); const cfg = aiConfig();
    await sb.from("product_ai_drafts").insert({ product_id: r.id, provider: cfg?.provider ?? null, model: cfg?.model ?? null, price, notes: (input.notes ?? "").slice(0, 1200), source_urls: cleanUrls(input.urls ?? ""), suggestion: { ...d, thumb: input.thumb ?? null }, needs_verification: [...stillNeeds, ...claims.map(c => "claim:" + c)], published: Boolean(input.publish), by_email: user?.email ?? null });
    revalidatePath("/admin/products"); revalidatePath("/admin/ai-product");
    return { ok: true, id: r.id, message: input.publish ? "Published. Remember to set the stock in Inventory." : "Saved as a draft (hidden from the shop). Open it in Products to finish and publish." };
  } catch (e) { return fail(e); }
}
function autoSeoFor(d: AiDraft) { return autoSeo({ name: d.name, brand: d.brand || undefined, short_description: d.short_description, description: d.description, product_type: d.product_type || undefined, category: d.category as ProductInput["category"] }); }

// ---------- Business email (central settings) ----------
const mailOk = (v: unknown) => /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/.test(String(v ?? "").trim());
export async function saveBusinessEmail(v: Pick<SiteSettings, "store_name" | "sender_name" | "email" | "reply_to" | "support_email" | "order_notify_email" | "invoice_email" | "refund_notify_email" | "smtp_host" | "smtp_port" | "smtp_secure" | "smtp_user" | "auto_email_invoice">): Promise<Res> {
  try {
    const sb = await admin(); const t = (x: unknown, n: number) => String(x ?? "").replace(/[\r\n<>"]/g, " ").trim().slice(0, n);
    for (const [k, label] of [["email", "Contact email"], ["reply_to", "Reply-to email"], ["support_email", "Support email"], ["order_notify_email", "Order notification email"], ["invoice_email", "Invoice email"], ["refund_notify_email", "Refund notification email"], ["smtp_user", "Sender (SMTP) email"]] as const) { const x = String((v as any)[k] ?? "").trim(); if (x && !mailOk(x)) return { ok: false, message: `${label} does not look like an email address.` }; }
    if (!mailOk(v.email)) return { ok: false, message: "Contact email is required." };
    const port = Math.floor(Number(v.smtp_port)); if (!(port > 0 && port < 65536)) return { ok: false, message: "SMTP port must be a number like 465 or 587." };
    const host = t(v.smtp_host, 100); if (!/^[a-z0-9.-]+$/i.test(host)) return { ok: false, message: "SMTP host looks wrong (example: smtp.gmail.com)." };
    const prev = await getSiteSettings();
    const data: SiteSettings = { ...prev, store_name: t(v.store_name, 80) || prev.store_name, sender_name: t(v.sender_name, 80), email: t(v.email, 160), reply_to: t(v.reply_to, 160), support_email: t(v.support_email, 160), order_notify_email: t(v.order_notify_email, 160), invoice_email: t(v.invoice_email, 160), refund_notify_email: t(v.refund_notify_email, 160), smtp_host: host.toLowerCase(), smtp_port: port, smtp_secure: Boolean(v.smtp_secure), smtp_user: t(v.smtp_user, 160), auto_email_invoice: Boolean(v.auto_email_invoice) };
    const { error } = await sb.from("site_settings").upsert({ id: 1, data }, { onConflict: "id" }); if (error) return { ok: false, message: error.message };
    await audit(sb, "settings.business_email", `contact ${data.email}, notify ${data.order_notify_email || "(default)"}, auto invoice ${data.auto_email_invoice ? "on" : "off"}`);
    refresh(); revalidatePath("/", "layout"); return { ok: true, message: "Saved ✓ The website and emails now use these addresses." };
  } catch (e) { return fail(e); }
}
export async function testEmailConnection(): Promise<Res> { try { await admin(); const r = await testConnection(); return { ok: r.ok, message: r.message }; } catch (e) { return fail(e); } }
export async function retryEmail(id: number): Promise<Res> {
  try { const sb = await admin(); const r = await retryLogged(Number(id)); await audit(sb, "email.retry", String(id)); revalidatePath("/admin/emails"); return r.ok ? { ok: true, message: r.skipped ? "Already sent earlier – nothing resent." : "Sent ✓" } : { ok: false, message: r.error ?? "Still failing." }; } catch (e) { return fail(e); }
}
/** Admin "Email invoice to customer". Printing never calls this. Each press sends once and is logged. */
export async function emailInvoice(orderId: string): Promise<Res> {
  try {
    const sb = await admin(); if (!emailConfigured()) return { ok: false, message: "Email is not set up yet (see Admin → Business Email)." };
    const id = String(orderId ?? "").slice(0, 60); const { data: row } = await sb.from("orders").select("email,payment_status,data").eq("id", id).maybeSingle(); if (!row) return { ok: false, message: "Order not found." };
    const st = await getSiteSettings(); const inv = await loadInvoice(id, brandOf(st)); if (!inv) return { ok: false, message: "Invoice could not be created (is migration-10 run?)." };
    const to = String(row.email).trim(); const r = await sendEmail({ to, kind: "invoice", orderId: id, replyTo: st.invoice_email || undefined, attachments: [{ filename: `${inv.invoiceNo}.pdf`, content: Buffer.from(await invoicePdf(inv)), contentType: "application/pdf" }], ...invoiceEmail(brandOf(st), row.data as TemporaryOrder, inv.invoiceNo) });
    await audit(sb, "invoice.email", `${id} → ${to} ${r.ok ? "sent" : "FAILED"}`); revalidatePath("/admin/emails");
    return r.ok ? { ok: true, message: `Invoice ${inv.invoiceNo} emailed to ${to} ✓` } : { ok: false, message: `Not sent: ${r.error}` };
  } catch (e) { return fail(e); }
}
/** Reply to a contact-form inquiry by email (saved on the message). */
export async function replyToMessage(id: string, reply: string): Promise<Res> {
  try {
    const sb = await admin(); const text = String(reply ?? "").trim().slice(0, 4000); if (text.length < 2) return { ok: false, message: "Write your reply first." };
    if (!emailConfigured()) return { ok: false, message: "Email is not set up yet (see Admin → Business Email)." };
    const { data: m } = await sb.from("messages").select("name,email,message").eq("id", id).maybeSingle(); if (!m) return { ok: false, message: "Message not found." };
    const st = await getSiteSettings(); const r = await sendEmail({ to: m.email, kind: "inquiry_reply", ...contactReply(brandOf(st), { name: m.name, reply: text, original: m.message }) });
    if (!r.ok) return { ok: false, message: `Not sent: ${r.error}` };
    await sb.from("messages").update({ replied_at: new Date().toISOString(), reply_text: text, is_read: true }).eq("id", id); await audit(sb, "message.reply", `${m.email}`); revalidatePath("/admin/messages");
    return { ok: true, message: "Reply emailed ✓" };
  } catch (e) { return fail(e); }
}

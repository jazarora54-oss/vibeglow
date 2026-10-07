"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { productToRow, slugify, type ProductInput } from "@/lib/data/mappers";
import { getLocalProducts } from "@/lib/data/products";
import { DEFAULT_FAQS, DEFAULT_PAGES, isPageSlug, type SiteSettings } from "@/lib/data/defaults";
import { stateCode, trackingUrl, CARRIERS } from "@/lib/shipping/rules";
import { getSiteSettings } from "@/lib/data/site";
import { shipFromOf } from "@/lib/shipping/settings";
import { buyShippoLabel, getShippoRate, getShippoRates, rateKey, shippoConfigured } from "@/lib/shipping/shippo";
import type { Parcel, RateOption, ShipAddress, TemporaryOrder } from "@/types";

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
const dbMsg = (m: string) => /duplicate key|unique/i.test(m) ? "That slug / code already exists. Please use a different one." : /shipping_mode|shipping_flat|shipping_extra|handling_days|pkg_(length|width|height)|label_cost|tracking_number|schema cache/i.test(m) ? "The database is missing the new shipping columns. Open Supabase -> SQL Editor, run supabase/migration-3.sql, then try again." : m;

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
    refresh(); return { ok: true, id };
  } catch (e) { return fail(e); }
}
export async function deleteProduct(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("products").delete().eq("id", id); if (error) return { ok: false, message: error.message }; refresh(); return { ok: true }; } catch (e) { return fail(e); }
}
export async function setProductActive(id: string, active: boolean): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("products").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id); if (error) return { ok: false, message: error.message }; refresh(); return { ok: true }; } catch (e) { return fail(e); }
}
/** One-click: copies the 12 built-in demo products into the database (skips ones already there). */
export async function importDemoProducts(): Promise<Res> {
  try {
    const sb = await admin();
    const rows = getLocalProducts().map(p => ({ ...productToRow({ ...p, is_active: true }), rating: p.rating, review_count: p.review_count, created_at: p.created_at }));
    const { error } = await sb.from("products").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) return { ok: false, message: dbMsg(error.message) };
    refresh(); return { ok: true, message: `${rows.length} demo products imported.` };
  } catch (e) { return fail(e); }
}

// ---------- Banners ----------
export interface BannerInput { id?: string; title: string; subtitle: string; button_text: string; button_link: string; image_url: string; sort_order: number; is_active: boolean }
export async function saveBanner(b: BannerInput): Promise<Res> {
  try {
    const sb = await admin();
    if (!b.image_url) return { ok: false, message: "Please upload a banner image." };
    const row = { title: b.title.trim(), subtitle: b.subtitle.trim(), button_text: b.button_text.trim(), button_link: b.button_link.trim() || "/shop", image_url: b.image_url, sort_order: Math.floor(Number(b.sort_order) || 0), is_active: b.is_active };
    const { error } = b.id ? await sb.from("banners").update(row).eq("id", b.id) : await sb.from("banners").insert(row);
    if (error) return { ok: false, message: error.message }; refresh(); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteBanner(id: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("banners").delete().eq("id", id); if (error) return { ok: false, message: error.message }; refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

// ---------- Coupons ----------
export interface CouponInput { code: string; kind: "percent" | "amount"; value: number; min_subtotal?: number; usage_limit?: number; expires_at?: string; is_active: boolean; isNew: boolean }
export async function saveCoupon(c: CouponInput): Promise<Res> {
  try {
    const sb = await admin();
    const code = c.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ""); if (!code) return { ok: false, message: "Enter a coupon code (letters / numbers)." };
    const v = Number(c.value); if (!(v > 0)) return { ok: false, message: "Discount value must be more than 0." }; if (c.kind === "percent" && v > 100) return { ok: false, message: "Percent cannot be more than 100." };
    const row = { code, percent_off: c.kind === "percent" ? v : null, amount_off: c.kind === "amount" ? v : null, min_subtotal: c.min_subtotal ? Number(c.min_subtotal) : null, usage_limit: c.usage_limit ? Math.floor(Number(c.usage_limit)) : null, expires_at: c.expires_at ? new Date(c.expires_at).toISOString() : null, is_active: c.is_active };
    const { error } = c.isNew ? await sb.from("coupons").insert(row) : await sb.from("coupons").update(row).eq("code", code);
    if (error) return { ok: false, message: dbMsg(error.message) }; revalidatePath("/admin/coupons"); return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteCoupon(code: string): Promise<Res> {
  try { const sb = await admin(); const { error } = await sb.from("coupons").delete().eq("code", code); if (error) return { ok: false, message: error.message }; revalidatePath("/admin/coupons"); return { ok: true }; } catch (e) { return fail(e); }
}

// ---------- Orders ----------
const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"], PAYMENTS = ["unpaid", "paid", "refunded"];
export async function updateOrder(id: string, v: { status: string; payment_status: string; notes: string; tracking_info?: string }): Promise<Res> {
  try {
    const sb = await admin();
    if (!STATUSES.includes(v.status) || !PAYMENTS.includes(v.payment_status)) return { ok: false, message: "Invalid status." };
    const { error } = await sb.from("orders").update({ status: v.status, payment_status: v.payment_status, notes: v.notes.slice(0, 2000), tracking_info: (v.tracking_info ?? "").trim().slice(0, 300) || null }).eq("id", id);
    if (error) return { ok: false, message: error.message }; revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); return { ok: true };
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
    const from = shipFromOf(await getSiteSettings()); if (!from) return { ok: false, message: "Fill in your ship-from address in Settings first (street, city, state, ZIP)." };
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
    return { ok: true, message: `Label bought: ${rate.carrier} ${rate.service}, $${rate.amount.toFixed(2)}.` };
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
    revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`); return { ok: true, message: "Tracking saved. The customer can see it on Track Order." };
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
    const data: SiteSettings = { store_name: (v.store_name || "VEDAGLOW").trim().slice(0, 80), tagline: v.tagline.trim().slice(0, 120), email: v.email.trim().slice(0, 160), phone: v.phone.trim().slice(0, 40), whatsapp: v.whatsapp.trim().slice(0, 40),
      address: v.address.trim().slice(0, 300), hours: v.hours.trim().slice(0, 200), instagram: cleanUrl(v.instagram), facebook: cleanUrl(v.facebook), tiktok: cleanUrl(v.tiktok), youtube: cleanUrl(v.youtube),
      free_shipping_over: money0(v.free_shipping_over, 0), default_flat_rate: money0(v.default_flat_rate, 5.99),
      ship_name: t(v.ship_name, 80), ship_company: t(v.ship_company, 80), ship_street1: t(v.ship_street1, 120), ship_street2: t(v.ship_street2, 80), ship_city: t(v.ship_city, 80), ship_state: state, ship_zip: zip, ship_phone: t(v.ship_phone, 40) };
    const { error } = await sb.from("site_settings").upsert({ id: 1, data }, { onConflict: "id" });
    if (error) return { ok: false, message: error.message }; refresh(); return { ok: true };
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

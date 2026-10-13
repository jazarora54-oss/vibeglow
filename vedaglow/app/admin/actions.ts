"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { productToRow, slugify, type ProductInput } from "@/lib/data/mappers";
import { getLocalProducts } from "@/lib/data/products";
import type { OrderItem, TemporaryOrder } from "@/types";
import { emailConfigured, sendBatch, sendEmail } from "@/lib/email";
import { offerEmail, statusUpdate } from "@/lib/emailTemplates";
import { getSiteSettings } from "@/lib/data/site";
import { siteUrl } from "@/lib/site";
import { DEFAULT_FAQS, DEFAULT_PAGES, isPageSlug, type SiteSettings } from "@/lib/data/defaults";

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
const dbMsg = (m: string) => /duplicate key|unique/i.test(m) ? "That slug / code already exists. Please use a different one." : m;

export async function signOut() { const sb = serverClient(); await sb.auth.signOut(); redirect("/admin/login"); }

// ---------- Products ----------
export async function saveProduct(input: ProductInput): Promise<Res> {
  try {
    const sb = await admin();
    if (!input.name?.trim()) return { ok: false, message: "Product name is required." };
    if (!(Number(input.price) >= 0) || input.price === ("" as unknown)) return { ok: false, message: "Enter a valid price." };
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
    if (error) return { ok: false, message: error.message };
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
type SB = ReturnType<typeof serverClient>;
/** sign +1 puts the order's quantities back in stock, -1 takes them out again. */
async function adjustStock(sb: SB, items: OrderItem[], sign: 1 | -1) {
  const by = new Map<string, OrderItem[]>(); for (const i of items) by.set(i.product_id, [...(by.get(i.product_id) ?? []), i]);
  for (const [pid, its] of by) {
    const { data: p } = await sb.from("products").select("stock,variants").eq("id", pid).maybeSingle(); if (!p) continue;
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    if (variants.length) {
      const nv = variants.map(v => { const q = its.filter(i => i.variant_id === v.id).reduce((n, i) => n + i.quantity, 0); return q ? { ...v, stock: Math.max(0, v.stock + sign * q) } : v; });
      await sb.from("products").update({ variants: nv, stock: nv.reduce((n, v) => n + v.stock, 0) }).eq("id", pid);
    } else await sb.from("products").update({ stock: Math.max(0, p.stock + sign * its.reduce((n, i) => n + i.quantity, 0)) }).eq("id", pid);
  }
}
export async function updateOrder(id: string, v: { status: string; payment_status: string; notes: string; tracking_info?: string }): Promise<Res> {
  try {
    const sb = await admin();
    if (!STATUSES.includes(v.status) || !PAYMENTS.includes(v.payment_status)) return { ok: false, message: "Invalid status." };
    const { data: cur } = await sb.from("orders").select("status,tracking_info,stock_restored,email,data").eq("id", id).maybeSingle();
    if (!cur) return { ok: false, message: "Order not found." };
    const was = cur.status as string, now = v.status, order = cur.data as TemporaryOrder; const notes: string[] = []; let restored = Boolean(cur.stock_restored);
    // Cancel before it ships -> stock goes back automatically. Undo the cancel -> stock is taken out again.
    if (now === "cancelled" && was !== "cancelled") {
      if ((was === "pending" || was === "processing") && !restored) { await adjustStock(sb, order.items ?? [], 1); restored = true; notes.push("Stock was put back in the shop."); }
      else if (was === "shipped" || was === "delivered") notes.push("The order had already shipped, so stock was NOT added back. Add it back yourself once the parcel returns.");
    } else if (was === "cancelled" && now !== "cancelled" && restored) { await adjustStock(sb, order.items ?? [], -1); restored = false; notes.push("Order re-opened: stock was taken out again."); }
    const tracking = (v.tracking_info ?? "").trim().slice(0, 300);
    const { error } = await sb.from("orders").update({ status: now, payment_status: v.payment_status, notes: v.notes.slice(0, 2000), tracking_info: tracking || null, stock_restored: restored }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    // Tell the customer when the status changes (or tracking is added on a shipped order).
    const statusChanged = now !== was, trackingChanged = tracking !== (cur.tracking_info ?? "");
    if (["processing", "shipped", "delivered", "cancelled"].includes(now) && (statusChanged || (now === "shipped" && trackingChanged))) {
      if (!emailConfigured()) notes.push("Customer email NOT sent: email is not set up yet.");
      else {
        const st = await getSiteSettings(); const mail = statusUpdate({ store_name: st.store_name, email: st.email }, order, now, tracking || null);
        if (mail) { const r = await sendEmail({ to: String(cur.email), ...mail }); notes.push(r.ok ? "Email sent to the customer." : `Email could not be sent: ${r.error}`); }
      }
    }
    revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); revalidatePath("/admin/products"); refresh();
    return { ok: true, message: ["Saved ✓", ...notes].join(" ") };
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
    const { error: ce } = await sb.from("coupons").insert(rows.map(({ _to, _token, ...c }) => c)); if (ce) return { ok: false, message: ce.message };
    const st = await getSiteSettings(); const brand = { store_name: st.store_name, email: st.email }; const exp = expires.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const mails = rows.map(r => { const m = offerEmail(brand, { name: prod.name, slug: prod.slug, kind: o.kind, value, code: r.code, expires: exp, message, unsubscribeUrl: `${siteUrl()}/unsubscribe?t=${r._token}` }); return { to: r._to as string, ...m }; });
    const sent = await sendBatch(mails);
    if (!sent.ok) { await sb.from("coupons").delete().in("code", rows.map(r => r.code)); return { ok: false, message: `Emails could not be sent: ${sent.error}` }; }
    await sb.from("offers").insert({ product_id: o.product_id, kind: o.kind, value, days, message: message || null, sent_count: rows.length });
    revalidatePath("/admin/offers"); revalidatePath("/admin/coupons");
    return { ok: true, message: `Offer sent to ${rows.length} customer${rows.length === 1 ? "" : "s"}.` };
  } catch (e) { return fail(e); }
}

// ---------- Store settings (contact info + social links) ----------
const cleanUrl = (u: string) => { const t = (u ?? "").trim(); if (!t) return ""; return /^https?:\/\//i.test(t) ? t.slice(0, 300) : `https://${t.slice(0, 300)}`; };
export async function saveSettings(v: SiteSettings): Promise<Res> {
  try {
    const sb = await admin();
    const data: SiteSettings = { store_name: (v.store_name || "VEDAGLOW").trim().slice(0, 80), tagline: v.tagline.trim().slice(0, 120), email: v.email.trim().slice(0, 160), phone: v.phone.trim().slice(0, 40), whatsapp: v.whatsapp.trim().slice(0, 40),
      address: v.address.trim().slice(0, 300), hours: v.hours.trim().slice(0, 200), instagram: cleanUrl(v.instagram), facebook: cleanUrl(v.facebook), tiktok: cleanUrl(v.tiktok), youtube: cleanUrl(v.youtube) };
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

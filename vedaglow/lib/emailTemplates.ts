import type { Address, TemporaryOrder } from "@/types";
import { siteUrl } from "@/lib/site";
import { money } from "@/lib/format";
export interface Brand { store_name: string; email?: string; logo_url?: string }
/** One place that decides how the business is shown in every email. */
export const brandOf = (st: { store_name: string; email?: string; support_email?: string; logo_url?: string }): Brand => ({ store_name: st.store_name || "VedaGlow", email: st.support_email || st.email || undefined, logo_url: /^https:\/\//.test(st.logo_url ?? "") ? st.logo_url : undefined });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const btn = (href: string, label: string) => `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#123d28;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
function wrap(b: Brand, inner: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;line-height:1.5"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden"><tr><td style="background:#123d28;color:#ffffff;padding:20px 28px;font-size:24px;letter-spacing:3px">${b.logo_url ? `<img src="${esc(b.logo_url)}" alt="${esc(b.store_name)}" height="40" style="display:block;height:40px;max-width:240px;border:0">` : esc(b.store_name)}</td></tr><tr><td style="padding:28px">${inner}</td></tr><tr><td style="padding:16px 28px;background:#f3ecdc;font-size:12px;color:#666666">${footer}</td></tr></table></td></tr></table></body></html>`;
}
const helpFooter = (b: Brand) => `Questions? ${b.email ? `Email us at ${esc(b.email)} or ` : ""}use the contact page: <a href="${siteUrl()}/contact" style="color:#123d28">${siteUrl()}/contact</a>`;
const addr = (a: Address) => `${esc(a.first_name)} ${esc(a.last_name)}<br>${esc(a.address1)}${a.address2 ? ", " + esc(a.address2) : ""}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}<br>${esc(a.country)}`;
const itemsTable = (o: TemporaryOrder) => `<table width="100%" cellpadding="6" cellspacing="0" style="border-top:1px solid #eee">${o.items.map(i => `<tr style="border-bottom:1px solid #eee"><td>${esc(i.name)}${i.variant_label ? " · " + esc(i.variant_label) : ""}<br><span style="color:#777;font-size:13px">Qty ${i.quantity}</span></td><td align="right" valign="top">${money(i.line_total)}</td></tr>`).join("")}</table>`;
const totals = (o: TemporaryOrder) => `<table width="100%" cellpadding="3" cellspacing="0" style="margin-top:8px"><tr><td>Subtotal</td><td align="right">${money(o.summary.subtotal)}</td></tr>${(o.summary.deals ?? []).map(d => `<tr><td>${esc(d.name)}</td><td align="right">−${money(d.amount)}</td></tr>`).join("")}${o.summary.discount > 0 ? `<tr><td>Discount${o.summary.coupon_code ? " (" + esc(o.summary.coupon_code) + ")" : ""}</td><td align="right">−${money(o.summary.discount)}</td></tr>` : ""}<tr><td>Shipping</td><td align="right">${o.summary.shipping ? money(o.summary.shipping) : "Free"}</td></tr><tr><td><b>Total</b></td><td align="right"><b>${money(o.summary.total)}</b></td></tr></table>`;

export function orderConfirmation(b: Brand, o: TemporaryOrder) {
  const first = o.checkout.shipping_address.first_name;
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Thank you for your order, ${esc(first)}!</h2><p>We have received your order <b>${esc(o.id)}</b>.</p>${itemsTable(o)}${totals(o)}<h3 style="color:#123d28;margin:24px 0 6px">Shipping to</h3><p style="margin:0">${addr(o.checkout.shipping_address)}</p><p style="margin:12px 0 0">Estimated delivery: ${esc(o.estimated_delivery)}</p>${btn(`${siteUrl()}/track-order`, "Track your order")}<p style="color:#666;font-size:13px">We will email you again when your order is on its way.</p>`, helpFooter(b));
  const text = `Thank you for your order, ${first}!\nOrder ${o.id}\n\n${o.items.map(i => `${i.name}${i.variant_label ? " (" + i.variant_label + ")" : ""} x${i.quantity}  ${money(i.line_total)}`).join("\n")}\n\nTotal: ${money(o.summary.total)}\nEstimated delivery: ${o.estimated_delivery}\nTrack your order: ${siteUrl()}/track-order`;
  return { subject: `Your ${b.store_name} order ${o.id} is confirmed`, html, text };
}
export function adminNewOrder(b: Brand, o: TemporaryOrder) {
  const c = o.checkout;
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">New order ${esc(o.id)}</h2><p>${esc(c.shipping_address.first_name)} ${esc(c.shipping_address.last_name)} · ${esc(c.contact.email)} · ${esc(c.contact.phone)}</p>${itemsTable(o)}${totals(o)}<h3 style="color:#123d28;margin:24px 0 6px">Ship to</h3><p style="margin:0">${addr(c.shipping_address)}</p>${btn(`${siteUrl()}/admin/orders`, "Open in admin")}`, "Internal notification");
  return { subject: `New order ${o.id} — ${money(o.summary.total)}`, html, text: `New order ${o.id} (${money(o.summary.total)}) from ${c.contact.email}. Open ${siteUrl()}/admin/orders` };
}
const STATUS_COPY: Record<string, { subject: string; head: string; body: string }> = {
  processing: { subject: "We are preparing your order", head: "We are preparing your order", body: "Good news! Your order is being prepared. We will let you know as soon as it ships." },
  shipped: { subject: "Your order has shipped", head: "Your order is on its way!", body: "Your order has been shipped." },
  delivered: { subject: "Your order was delivered", head: "Your order was delivered", body: "Your order has been marked as delivered. We hope you love it! If something is not right, please contact us." },
  cancelled: { subject: "Your order was cancelled", head: "Your order has been cancelled", body: "Your order has been cancelled. If you did not ask for this, or you have any questions, please contact us and we will help." },
};
export function statusUpdate(b: Brand, o: TemporaryOrder, status: string, tracking?: string | null) {
  const c = STATUS_COPY[status]; if (!c) return null;
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">${esc(c.head)}</h2><p>Order <b>${esc(o.id)}</b></p><p>${esc(c.body)}</p>${tracking ? `<p style="background:#faf6ee;padding:12px;border-radius:8px"><b>Tracking:</b> ${esc(tracking)}</p>` : ""}${itemsTable(o)}${btn(`${siteUrl()}/track-order`, "Track your order")}`, helpFooter(b));
  return { subject: `${c.subject} (${o.id})`, html, text: `${c.head}\nOrder ${o.id}\n${c.body}${tracking ? `\nTracking: ${tracking}` : ""}\nTrack: ${siteUrl()}/track-order` };
}
export function refundEmail(b: Brand, o: TemporaryOrder) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Your refund is on its way</h2><p>Order <b>${esc(o.id)}</b></p><p>We have refunded <b>${money(o.payment?.amount ?? o.summary.total)}</b> to your original payment method. Your bank usually shows it within 5-10 business days.</p>${btn(`${siteUrl()}/track-order`, "View your order")}`, helpFooter(b));
  return { subject: `Your refund for order ${o.id}`, html, text: `Your refund is on its way\nOrder ${o.id}\nWe refunded ${money(o.payment?.amount ?? o.summary.total)} to your original payment method (usually 5-10 business days).\n${siteUrl()}/track-order` };
}
/** Who gets "new order" mail: Business Email settings first, then the old env variable, then the support email. */
export const notifyEmail = (st: { order_notify_email?: string; support_email?: string; email?: string }, env: Record<string, string | undefined> = process.env) => (st.order_notify_email || env.ORDER_NOTIFY_EMAIL || st.support_email || st.email || "").trim();
export function invoiceEmail(b: Brand, o: TemporaryOrder, invoiceNo: string) {
  const first = o.checkout.shipping_address.first_name;
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Your invoice ${esc(invoiceNo)}</h2><p>Hi ${esc(first)}, your invoice for order <b>${esc(o.id)}</b> is attached as a PDF.</p>${itemsTable(o)}${totals(o)}${btn(`${siteUrl()}/track-order`, "Track your order")}`, helpFooter(b));
  return { subject: `Invoice ${invoiceNo} for your ${b.store_name} order ${o.id}`, html, text: `Hi ${first}, your invoice ${invoiceNo} for order ${o.id} is attached (PDF). Total ${money(o.summary.total)}. ${siteUrl()}/track-order` };
}
export function refundNoticeAdmin(b: Brand, o: TemporaryOrder) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Refund processed – order ${esc(o.id)}</h2><p>${money(o.payment?.amount ?? o.summary.total)} was refunded to ${esc(o.checkout.contact.email)}.</p>${btn(`${siteUrl()}/admin/orders/${encodeURIComponent(o.id)}`, "Open the order")}`, "Internal notice");
  return { subject: `Refund processed – ${b.store_name} order ${o.id}`, html, text: `Refund processed for order ${o.id}: ${money(o.payment?.amount ?? o.summary.total)} to ${o.checkout.contact.email}.` };
}
export function contactNotify(b: Brand, m: { name: string; email: string; subject?: string | null; message: string }) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">New customer inquiry</h2><p><b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt;</p>${m.subject ? `<p>Subject: ${esc(m.subject)}</p>` : ""}<p style="white-space:pre-wrap;background:#faf6ee;padding:12px;border-radius:8px">${esc(m.message)}</p>${btn(`${siteUrl()}/admin/messages`, "Open and reply")}`, "Internal notice – reply from Admin → Messages");
  return { subject: `New Customer Inquiry – ${b.store_name}`, html, text: `New inquiry from ${m.name} <${m.email}>:\n\n${m.message}\n\nReply: ${siteUrl()}/admin/messages` };
}
export function contactAck(b: Brand, m: { name: string; message: string }) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">We got your message, ${esc(m.name.split(" ")[0])}</h2><p>Thank you for contacting ${esc(b.store_name)}. We usually reply within 1–2 business days.</p><p style="color:#666">Your message:</p><p style="white-space:pre-wrap;background:#faf6ee;padding:12px;border-radius:8px">${esc(m.message.slice(0, 600))}</p>`, helpFooter(b));
  return { subject: `We received your message – ${b.store_name}`, html, text: `Hi ${m.name}, thank you for contacting ${b.store_name}. We usually reply within 1-2 business days.\n\nYour message:\n${m.message.slice(0, 600)}` };
}
export function contactReply(b: Brand, m: { name: string; reply: string; original: string }) {
  const html = wrap(b, `<p>Hi ${esc(m.name.split(" ")[0])},</p><p style="white-space:pre-wrap">${esc(m.reply)}</p><p style="color:#888;font-size:12px;margin-top:24px">In reply to your message:</p><p style="white-space:pre-wrap;color:#666;font-size:13px;border-left:3px solid #e9d2b4;padding-left:10px">${esc(m.original.slice(0, 500))}</p>`, helpFooter(b));
  return { subject: `Re: your message to ${b.store_name}`, html, text: `Hi ${m.name},\n\n${m.reply}\n\n--\nIn reply to: ${m.original.slice(0, 500)}` };
}
export function testEmail(b: Brand) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Test email</h2><p>If you can read this, order emails from ${esc(b.store_name)} are working.</p>`, helpFooter(b));
  return { subject: `${b.store_name}: test email`, html, text: "Test email. Order emails are working." };
}
export function offerEmail(b: Brand, p: { name: string; slug: string; kind: "percent" | "amount"; value: number; code: string; expires: string; message: string; unsubscribeUrl: string }) {
  const off = p.kind === "percent" ? `${p.value}% off` : `${money(p.value)} off`;
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">${esc(off)} ${esc(p.name)}</h2>${p.message ? `<p>${esc(p.message)}</p>` : ""}<p style="font-size:14px;color:#666">Your personal code (one use only):</p><p style="font-size:26px;letter-spacing:3px;font-weight:bold;color:#b8862b;margin:4px 0">${esc(p.code)}</p><p style="color:#666;font-size:13px">Valid until ${esc(p.expires)}. Add the product to your cart and enter the code in the cart.</p>${btn(`${siteUrl()}/product/${p.slug}`, "View product")}`,
    `You are receiving this because you asked for offers on this product at ${esc(b.store_name)}. <a href="${esc(p.unsubscribeUrl)}" style="color:#123d28">Unsubscribe</a>`);
  return { subject: `${off} ${p.name} — just for you`, html, text: `${off} ${p.name}\n${p.message}\nYour code: ${p.code} (valid until ${p.expires}, one use)\n${siteUrl()}/product/${p.slug}\nUnsubscribe: ${p.unsubscribeUrl}` };
}
export function confirmSubscriptionEmail(b: Brand, p: { confirmUrl: string }) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Please confirm your email</h2><p>Someone (hopefully you) asked to receive news and offers from ${esc(b.store_name)}. Press the button to confirm. If this was not you, just ignore this email and nothing will be sent.</p><p><a href="${esc(p.confirmUrl)}" style="display:inline-block;background:#123d28;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">Yes, subscribe me</a></p>`, `${helpFooter(b)}`);
  return { subject: `Please confirm your subscription to ${b.store_name}`, html, text: `Please confirm your subscription to ${b.store_name}: ${p.confirmUrl}\nIf this was not you, ignore this email.` };
}
export function welcomeEmail(b: Brand, p: { code: string; unsubscribeUrl: string }) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Welcome to ${esc(b.store_name)}</h2><p>Thank you for subscribing. We will send you news about new products and offers.</p>${p.code ? `<p style="font-size:14px;color:#666">Your code:</p><p style="font-size:26px;letter-spacing:3px;font-weight:bold;color:#b8862b;margin:4px 0">${esc(p.code)}</p>` : ""}${btn(`${siteUrl()}/shop`, "Start shopping")}`,
    `${helpFooter(b)}<br>You are receiving this because you subscribed at ${esc(b.store_name)}. <a href="${esc(p.unsubscribeUrl)}" style="color:#123d28">Unsubscribe</a>`);
  return { subject: `Welcome to ${b.store_name}`, html, text: `Welcome to ${b.store_name}. Thank you for subscribing.${p.code ? `\nYour code: ${p.code}` : ""}\n${siteUrl()}/shop\nUnsubscribe: ${p.unsubscribeUrl}` };
}


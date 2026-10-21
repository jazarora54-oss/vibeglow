import type { Address, TemporaryOrder } from "@/types";
import { siteUrl } from "@/lib/site";
import { money } from "@/lib/format";
export interface Brand { store_name: string; email?: string }
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const btn = (href: string, label: string) => `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#123d28;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
function wrap(b: Brand, inner: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;line-height:1.5"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden"><tr><td style="background:#123d28;color:#ffffff;padding:20px 28px;font-size:24px;letter-spacing:3px">${esc(b.store_name)}</td></tr><tr><td style="padding:28px">${inner}</td></tr><tr><td style="padding:16px 28px;background:#f3ecdc;font-size:12px;color:#666666">${footer}</td></tr></table></td></tr></table></body></html>`;
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
export function offerEmail(b: Brand, p: { name: string; slug: string; kind: "percent" | "amount"; value: number; code: string; expires: string; message: string; unsubscribeUrl: string }) {
  const off = p.kind === "percent" ? `${p.value}% off` : `${money(p.value)} off`;
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">${esc(off)} ${esc(p.name)}</h2>${p.message ? `<p>${esc(p.message)}</p>` : ""}<p style="font-size:14px;color:#666">Your personal code (one use only):</p><p style="font-size:26px;letter-spacing:3px;font-weight:bold;color:#b8862b;margin:4px 0">${esc(p.code)}</p><p style="color:#666;font-size:13px">Valid until ${esc(p.expires)}. Add the product to your cart and enter the code in the cart.</p>${btn(`${siteUrl()}/product/${p.slug}`, "View product")}`,
    `You are receiving this because you asked for offers on this product at ${esc(b.store_name)}. <a href="${esc(p.unsubscribeUrl)}" style="color:#123d28">Unsubscribe</a>`);
  return { subject: `${off} ${p.name} — just for you`, html, text: `${off} ${p.name}\n${p.message}\nYour code: ${p.code} (valid until ${p.expires}, one use)\n${siteUrl()}/product/${p.slug}\nUnsubscribe: ${p.unsubscribeUrl}` };
}
export function welcomeEmail(b: Brand, p: { code: string; unsubscribeUrl: string }) {
  const html = wrap(b, `<h2 style="margin:0 0 8px;color:#123d28">Welcome to ${esc(b.store_name)}</h2><p>Thank you for subscribing. We will send you news about new products and offers.</p>${p.code ? `<p style="font-size:14px;color:#666">Your code:</p><p style="font-size:26px;letter-spacing:3px;font-weight:bold;color:#b8862b;margin:4px 0">${esc(p.code)}</p>` : ""}${btn(`${siteUrl()}/shop`, "Start shopping")}`,
    `${helpFooter(b)}<br>You are receiving this because you subscribed at ${esc(b.store_name)}. <a href="${esc(p.unsubscribeUrl)}" style="color:#123d28">Unsubscribe</a>`);
  return { subject: `Welcome to ${b.store_name}`, html, text: `Welcome to ${b.store_name}. Thank you for subscribing.${p.code ? `\nYour code: ${p.code}` : ""}\n${siteUrl()}/shop\nUnsubscribe: ${p.unsubscribeUrl}` };
}


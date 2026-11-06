"use client";
/** Visitor tracking helpers. Nothing is sent unless the visitor clicked "Accept" (or Analytics/Pixel scripts are not loaded). */
export type Consent = "granted" | "denied" | "unset";
const KEY = "vedaglow:consent:v1";
export function getConsent(): Consent {
  try {
    if ((navigator as any).globalPrivacyControl === true || navigator.doNotTrack === "1") return "denied"; // browser privacy signals are respected
    const v = localStorage.getItem(KEY); return v === "granted" || v === "denied" ? v : "unset";
  } catch { return "unset"; }
}
export function setConsent(c: "granted" | "denied") { try { localStorage.setItem(KEY, c); } catch { /* ignore */ } window.dispatchEvent(new Event("vedaglow:consent")); }

export interface TrackItem { id: string; name: string; price: number; quantity?: number; variant?: string }
type W = typeof window & { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
const num = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
/** e-commerce events for Google Analytics 4 and the Meta Pixel (whichever is loaded). Never throws. */
const META: Record<string, string> = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" };
function sendPixel(event: string, p: { items: TrackItem[]; value: number; transactionId?: string }, tries: number) {
  const w = window as W;
  if (w.fbq) { w.fbq("track", META[event], { value: num(p.value), currency: "USD", content_ids: p.items.map(i => i.id), content_type: "product", num_items: p.items.reduce((s, i) => s + (i.quantity ?? 1), 0) }, p.transactionId ? { eventID: p.transactionId } : undefined); return; }
  if (tries < 5) setTimeout(() => sendPixel(event, p, tries + 1), 1000); // the Pixel script may still be loading (or is simply not configured)
}
export function track(event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase", p: { items: TrackItem[]; value: number; transactionId?: string }) {
  try {
    if (getConsent() !== "granted") return; // no consent, nothing is sent
    const w = window as W; const items = p.items.map(i => ({ item_id: i.id, item_name: i.name, price: num(i.price), quantity: i.quantity ?? 1, item_variant: i.variant }));
    // Google: events pushed before gtag.js has loaded are queued in dataLayer and sent when it arrives.
    (w as any).dataLayer = (w as any).dataLayer || []; if (!w.gtag) w.gtag = function () { (w as any).dataLayer.push(arguments); };
    w.gtag("event", event, { currency: "USD", value: num(p.value), items, ...(p.transactionId ? { transaction_id: p.transactionId } : {}) });
    sendPixel(event, p, 0);
  } catch { /* tracking must never break the shop */ }
}

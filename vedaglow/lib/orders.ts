import type { CartItem, CheckoutData, Coupon, TemporaryOrder } from "@/types";
import { calculateSummary, getShippingMethod } from "@/lib/cart/cartCalculations";
import { DELIVERY_DAYS } from "@/lib/cart/config";
const KEY = "vedaglow:orders:v1";
const read = (): TemporaryOrder[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
function newOrderId() {
  const d = new Date(); const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `VDG-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}
const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
function deliveryRange() { const a = new Date(), b = new Date(); a.setDate(a.getDate() + DELIVERY_DAYS.min); b.setDate(b.getDate() + DELIVERY_DAYS.max); return `${fmtDate(a)} – ${fmtDate(b)}`; }
/** Client-side temporary order (localStorage). Replace the body with a Supabase insert (+ Stripe payment intent) later; keep the signature. Never stores payment details. */
export function createOrder(items: CartItem[], checkout: CheckoutData, coupon?: Coupon | null): TemporaryOrder {
  const method = getShippingMethod(checkout.shipping_method_id);
  const summary = calculateSummary(items, coupon, method.id);
  const order: TemporaryOrder = {
    id: newOrderId(), created_at: new Date().toISOString(), status: "pending-payment", summary, checkout, shipping_method: method, estimated_delivery: `${deliveryRange()} (${method.eta})`,
    items: items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, name: i.name ?? "Product", slug: i.slug, variant_label: i.variant_label, sku: i.sku, image: i.image, visual: i.visual, quantity: i.quantity, unit_price: i.unit_price, line_total: Math.round(i.quantity * i.unit_price * 100) / 100 })),
  };
  return storeOrderLocally(order);
}
/** Keeps a copy on this device so the confirmation page can show it. */
export function storeOrderLocally(order: TemporaryOrder): TemporaryOrder {
  try { localStorage.setItem(KEY, JSON.stringify([order, ...read().filter(o => o.id !== order.id)].slice(0, 20))); } catch { /* storage unavailable */ }
  return order;
}
export const getOrder = (id: string): TemporaryOrder | null => read().find(o => o.id === id) ?? null;

import type { CartItem, CheckoutData, Coupon, ShippingOption, TemporaryOrder } from "@/types";
import { calculateSummary } from "@/lib/cart/cartCalculations";
import { DEFAULT_HANDLING_DAYS, deliveryRange, toShippingMethod } from "@/lib/shipping/rules";
const KEY = "vedaglow:orders:v1";
const read = (): TemporaryOrder[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
function newOrderId() {
  const d = new Date(); const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `VDG-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}
/** Client-side temporary order (localStorage), used only while the database is not connected. Never stores payment details. */
export function createOrder(items: CartItem[], checkout: CheckoutData, coupon: Coupon | null | undefined, option: ShippingOption): TemporaryOrder {
  const summary = calculateSummary(items, coupon, { amount: option.price });
  const method = toShippingMethod(option);
  const order: TemporaryOrder = {
    id: newOrderId(), created_at: new Date().toISOString(), status: "pending-payment", summary, checkout, shipping_method: method, estimated_delivery: deliveryRange(DEFAULT_HANDLING_DAYS, option.days_min, option.days_max),
    items: items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, name: i.name ?? "Product", slug: i.slug, variant_label: i.variant_label, sku: i.sku, image: i.image, visual: i.visual, quantity: i.quantity, unit_price: i.unit_price, line_total: Math.round(i.quantity * i.unit_price * 100) / 100, weight_g: i.weight_g, pkg: i.pkg, ship_mode: i.ship_mode })),
  };
  return storeOrderLocally(order);
}
/** Keeps a copy on this device so the confirmation page can show it. */
export function storeOrderLocally(order: TemporaryOrder): TemporaryOrder {
  try { localStorage.setItem(KEY, JSON.stringify([order, ...read().filter(o => o.id !== order.id)].slice(0, 20))); } catch { /* storage unavailable */ }
  return order;
}
export const getOrder = (id: string): TemporaryOrder | null => read().find(o => o.id === id) ?? null;

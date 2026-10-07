import type { CartItem, Coupon, OrderSummary } from "@/types";
import { DEMO_COUPONS, TAX_RATE } from "./config";
import { estimateShipping, lineFromCart, type ShipConfig } from "@/lib/shipping/rules";
const r2 = (n: number) => Math.round(n * 100) / 100;
export const calculateItemCount = (items: CartItem[]) => items.reduce((s, i) => s + i.quantity, 0);
export const calculateSubtotal = (items: CartItem[]) => r2(items.reduce((s, i) => s + i.unit_price * i.quantity, 0));
export const findCoupon = (code: string) => DEMO_COUPONS.find(c => c.code === code.trim().toUpperCase());
/** Discount never exceeds the subtotal, so the total cannot go below zero. */
export function calculateDiscount(subtotal: number, coupon?: Coupon | null) {
  if (!coupon || (coupon.min_subtotal && subtotal < coupon.min_subtotal)) return 0;
  const d = coupon.percent_off ? subtotal * coupon.percent_off / 100 : coupon.amount_off ?? 0;
  return r2(Math.min(Math.max(d, 0), subtotal));
}
export const calculateTax = (taxable: number) => r2(Math.max(taxable, 0) * TAX_RATE);
export const calculateGrandTotal = (subtotal: number, discount: number, shipping: number, tax: number) => r2(Math.max(subtotal - discount, 0) + shipping + tax);
/** Progress toward the store-wide "free shipping over $X" rule (admin -> Settings). enabled=false when it is switched off. */
export function calculateFreeShippingProgress(subtotal: number, freeOver: number) {
  if (!(freeOver > 0)) return { enabled: false, remaining: 0, qualifies: false, percent: 0 };
  return { enabled: true, remaining: r2(Math.max(freeOver - subtotal, 0)), qualifies: subtotal >= freeOver, percent: Math.min(100, Math.round(subtotal / freeOver * 100)) };
}
/** The ONE place totals are computed: Cart, Mini Cart, Checkout and Order Confirmation all use it. `shipping` is already decided (estimate in the cart, chosen option at checkout). */
export function calculateSummary(items: CartItem[], coupon?: Coupon | null, shipping: { amount: number; pending?: boolean } = { amount: 0 }): OrderSummary {
  const subtotal = calculateSubtotal(items); const discount = calculateDiscount(subtotal, coupon);
  const ship = r2(Math.max(shipping.amount, 0)); const tax = calculateTax(subtotal - discount);
  return { item_count: calculateItemCount(items), subtotal, discount, shipping: ship, tax, total: calculateGrandTotal(subtotal, discount, ship, tax), coupon_code: discount > 0 ? coupon?.code : undefined, ...(shipping.pending ? { shipping_pending: true } : {}) };
}
/** Cart / mini cart: summary using the best shipping estimate we have before an address is known. */
export const cartSummary = (items: CartItem[], coupon: Coupon | null | undefined, cfg: ShipConfig) => calculateSummary(items, coupon, estimateShipping(items.map(lineFromCart), calculateSubtotal(items), cfg));

import type { CartItem, Coupon, OrderSummary, ShippingMethod } from "@/types";
import { DEMO_COUPONS, FREE_SHIPPING_THRESHOLD, SHIPPING_METHODS, TAX_RATE } from "./config";
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
export const getShippingMethod = (id?: string): ShippingMethod => SHIPPING_METHODS.find(m => m.id === id) ?? SHIPPING_METHODS[0];
export function calculateShipping(subtotal: number, method?: ShippingMethod) {
  const m = method ?? SHIPPING_METHODS[0];
  if (subtotal <= 0) return 0;
  return m.free_over !== undefined && subtotal >= m.free_over ? 0 : m.price;
}
export const calculateTax = (taxable: number) => r2(Math.max(taxable, 0) * TAX_RATE);
export const calculateGrandTotal = (subtotal: number, discount: number, shipping: number, tax: number) => r2(Math.max(subtotal - discount, 0) + shipping + tax);
export function calculateFreeShippingProgress(subtotal: number) {
  const remaining = r2(Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0));
  return { remaining, qualifies: subtotal >= FREE_SHIPPING_THRESHOLD, percent: Math.min(100, Math.round(subtotal / FREE_SHIPPING_THRESHOLD * 100)) };
}
/** The ONE place totals are computed: Cart, Mini Cart, Checkout and Order Confirmation all use it. */
export function calculateSummary(items: CartItem[], coupon?: Coupon | null, shippingId?: string): OrderSummary {
  const subtotal = calculateSubtotal(items); const discount = calculateDiscount(subtotal, coupon);
  const shipping = calculateShipping(subtotal, getShippingMethod(shippingId)); const tax = calculateTax(subtotal - discount);
  return { item_count: calculateItemCount(items), subtotal, discount, shipping, tax, total: calculateGrandTotal(subtotal, discount, shipping, tax), coupon_code: discount > 0 ? coupon?.code : undefined };
}

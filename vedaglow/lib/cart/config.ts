import type { Coupon, ShippingMethod } from "@/types";
// Central cart/checkout settings. Later these can come from the database / a shipping + tax provider.
export const FREE_SHIPPING_THRESHOLD = 49;
export const STANDARD_SHIPPING = 5.99;
/** 0 = no tax line is shown until a real tax system exists. Never present this as the customer's actual tax. */
export const TAX_RATE = 0;
export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", name: "Standard Shipping", description: "Estimated shipping (demo, not a live carrier rate)", eta: "5–8 business days", price: STANDARD_SHIPPING, free_over: FREE_SHIPPING_THRESHOLD },
];
export const DEFAULT_SHIPPING_ID = "standard";
/** Demo coupons only. Replace with a database lookup later. */
export const DEMO_COUPONS: Coupon[] = [
  { code: "WELCOME10", percent_off: 10 },
  { code: "VEDA5", amount_off: 5, min_subtotal: 25 },
];
export const COUPON_HINT = "Try WELCOME10 (demo coupon).";
export const DELIVERY_DAYS = { min: 5, max: 8 };

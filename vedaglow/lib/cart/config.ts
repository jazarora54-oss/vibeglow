import type { Coupon } from "@/types";
// Central cart/checkout settings. Shipping is NOT here any more: it comes from each product's shipping settings,
// admin -> Settings (free-over amount, default flat rate) and lib/shipping/*.
/** 0 = no tax line is shown until a real tax system exists. Never present this as the customer's actual tax. */
export const TAX_RATE = 0;
/** Demo coupons only. Replace with a database lookup later. */
export const DEMO_COUPONS: Coupon[] = [
  { code: "WELCOME10", percent_off: 10 },
  { code: "VEDA5", amount_off: 5, min_subtotal: 25 },
];
export const COUPON_HINT = "Try WELCOME10 (demo coupon).";

import type { Product } from "@/types";
export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
export const discountPct = (p: Product) => p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;

export const percentOff = (price: number, compare?: number) => compare && compare > price ? Math.round((1 - price / compare) * 100) : 0;
/** The store's time zone. Every date and time in the admin is shown in it (the server itself runs in UTC, which showed orders on the wrong evening). */
export const STORE_TZ = "America/Los_Angeles";
export const fmtDateTime = (iso: string | number | Date, long = false) => new Intl.DateTimeFormat("en-US", { timeZone: STORE_TZ, dateStyle: long ? "long" : "medium", timeStyle: "short" }).format(new Date(iso));
export const fmtDate = (iso: string | number | Date) => new Intl.DateTimeFormat("en-US", { timeZone: STORE_TZ, dateStyle: "medium" }).format(new Date(iso));
/** YYYYMMDD of "today" in store time (used in order numbers). */
export const ymdStore = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TZ }).format(d).replace(/-/g, "");


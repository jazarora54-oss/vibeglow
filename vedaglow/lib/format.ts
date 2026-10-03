import type { Product } from "@/types";
export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
export const discountPct = (p: Product) => p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;

export const percentOff = (price: number, compare?: number) => compare && compare > price ? Math.round((1 - price / compare) * 100) : 0;

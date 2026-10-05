import type { CartItem } from "@/types";
import { getStockForLines } from "@/app/actions/store";
import { lineKey } from "@/components/CartProvider";
/** Live stock per cart line (key -> stock), read on the server from the database. */
export const getLiveStock = (items: CartItem[]): Promise<Record<string, number>> =>
  getStockForLines(items.map(i => ({ key: lineKey(i), slug: i.slug, variant_id: i.variant_id })));
export type CartIssue = { key: string; name: string; message: string };
export const cartIssues = (items: CartItem[]): CartIssue[] => items.flatMap(i => {
  const key = lineKey(i); const max = i.max_stock ?? Infinity; const name = i.name ?? "Item";
  if (max <= 0) return [{ key, name, message: `${name} is out of stock. Please remove it to continue.` }];
  if (i.quantity > max) return [{ key, name, message: `Only ${max} of ${name} available. Please lower the quantity.` }];
  return [];
});

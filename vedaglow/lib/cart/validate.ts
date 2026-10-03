import type { CartItem } from "@/types";
import { getProductBySlug } from "@/lib/data/products";
import { lineKey } from "@/components/CartProvider";
/** Live stock per cart line (key -> stock). Swap getProductBySlug for a Supabase query later; the real check must also run on the server. */
export async function getLiveStock(items: CartItem[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(items.map(async i => {
    const p = i.slug ? await getProductBySlug(i.slug) : null;
    const v = p?.variants?.find(x => x.id === i.variant_id);
    out[lineKey(i)] = !p ? 0 : v ? v.stock : i.variant_id ? 0 : p.stock;
  }));
  return out;
}
export type CartIssue = { key: string; name: string; message: string };
export const cartIssues = (items: CartItem[]): CartIssue[] => items.flatMap(i => {
  const key = lineKey(i); const max = i.max_stock ?? Infinity; const name = i.name ?? "Item";
  if (max <= 0) return [{ key, name, message: `${name} is out of stock. Please remove it to continue.` }];
  if (i.quantity > max) return [{ key, name, message: `Only ${max} of ${name} available. Please lower the quantity.` }];
  return [];
});

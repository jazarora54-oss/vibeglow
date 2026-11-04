import type { OrderItem } from "@/types";
/** sign +1 puts the order's quantities back in stock, -1 takes them out again. */
export async function adjustStock(sb: any, items: OrderItem[], sign: 1 | -1, strict = false): Promise<boolean> {
  // Preferred: one atomic database function (rows are locked, so two buyers can never take the same last item).
  const payload = items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id ?? null, quantity: i.quantity }));
  const { error } = await sb.rpc("apply_stock", { p_items: payload, p_sign: sign, p_strict: strict });
  if (!error) return true;
  if (String(error.message ?? "").includes("insufficient_stock")) return false;
  const missing = error.code === "PGRST202" || error.code === "42883" || /could not find the function/i.test(String(error.message ?? ""));
  if (!missing) { console.error("apply_stock failed:", error.message); return false; }
  await legacyAdjust(sb, items, sign); // migration 9 not run yet: old behaviour so the live shop keeps working
  return true;
}
async function legacyAdjust(sb: any, items: OrderItem[], sign: 1 | -1) {
  const by = new Map<string, OrderItem[]>(); for (const i of items) by.set(i.product_id, [...(by.get(i.product_id) ?? []), i]);
  for (const [pid, its] of by) {
    const { data: p } = await sb.from("products").select("stock,variants").eq("id", pid).maybeSingle(); if (!p) continue;
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    if (variants.length) {
      const nv = variants.map((v: any) => { const q = its.filter(i => i.variant_id === v.id).reduce((n, i) => n + i.quantity, 0); return q ? { ...v, stock: Math.max(0, v.stock + sign * q) } : v; });
      await sb.from("products").update({ variants: nv, stock: nv.reduce((n: number, v: any) => n + v.stock, 0) }).eq("id", pid);
    } else await sb.from("products").update({ stock: Math.max(0, p.stock + sign * its.reduce((n, i) => n + i.quantity, 0)) }).eq("id", pid);
  }
}

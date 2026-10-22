import type { OrderItem } from "@/types";
/** sign +1 puts the order's quantities back in stock, -1 takes them out again. */
export async function adjustStock(sb: any, items: OrderItem[], sign: 1 | -1) {
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

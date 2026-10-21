/** Dashboard numbers. Pure functions (no database calls) so they can be tested. All days are Pacific time, like the rest of the admin. */
export const TZ = "America/Los_Angeles";
export const LOW_STOCK_AT = 5;
const r2 = (n: number) => Math.round(n * 100) / 100;
const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
const addDays = (day: string, n: number) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** The exact moment a Pacific-time day begins (handles summer / winter time). */
function startOfDay(day: string): Date { for (const off of ["-07:00", "-08:00"]) { const d = new Date(`${day}T00:00:00${off}`); if (dayOf(d) === day && dayOf(new Date(d.getTime() - 1)) !== day) return d; } return new Date(`${day}T00:00:00-08:00`); }
export type RangeKey = "today" | "7d" | "30d" | "month" | "custom";
export interface Range { key: RangeKey; label: string; from: Date; to: Date /* exclusive */; fromDay: string; toDay: string; error?: string }
const isDay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export function resolveRange(sp: { range?: string; from?: string; to?: string }, now = new Date()): Range {
  const today = dayOf(now); let key = (["today", "7d", "30d", "month", "custom"].includes(sp.range ?? "") ? sp.range : "30d") as RangeKey; let a = addDays(today, -29), b = today, label = "Last 30 days"; let error: string | undefined;
  if (key === "today") { a = today; label = "Today"; }
  else if (key === "7d") { a = addDays(today, -6); label = "Last 7 days"; }
  else if (key === "month") { a = today.slice(0, 8) + "01"; label = "This month"; }
  else if (key === "custom") {
    if (isDay(sp.from) && isDay(sp.to) && sp.from! <= sp.to!) { a = sp.from!; b = sp.to!; label = `${a} → ${b}`; }
    else { key = "30d"; error = "Choose a start date and an end date (the end must not be before the start). Showing the last 30 days instead."; }
  }
  return { key, label, from: startOfDay(a), to: startOfDay(addDays(b, 1)), fromDay: a, toDay: b, error };
}

export interface OrderRow { id: string; created_at: string; status: string; payment_status: string; total: number | string; customer_name?: string | null; is_test?: boolean | null; summary?: { subtotal?: number; discount?: number; deal_discount?: number } | null; items?: { product_id: string; name: string; quantity: number; line_total: number }[] | null }
export interface ProductRow { id: string; name: string; stock: number; is_active: boolean; updated_at?: string }
export interface Stats {
  orders: { total: number; pending: number; processing: number; shipped: number; delivered: number; cancelled: number; test: number };
  money: { gross: number; discounts: number; refunds: number; refundedProducts: number; net: number; awaitingPayment: number; paidOrders: number };
  best: { id: string; name: string; units: number; revenue: number }[];
  low: ProductRow[]; out: ProductRow[];
}
/**
 * How the money is counted (shown on the dashboard too):
 *  - Only orders whose payment is "paid" or "refunded" count as sales. Unpaid orders are listed separately as "waiting for payment".
 *  - Test orders (marked in the order page) are never counted.
 *  - Gross sales = product value before discounts (shipping and tax are not included).
 *  - Discounts = coupons + automatic deals.
 *  - Refunds = full amount of orders marked "refunded" (incl. shipping). Their product value is taken out of net sales.
 *  - Net sales = Gross sales − Discounts − refunded product value.
 */
export function computeStats(orders: OrderRow[], products: ProductRow[]): Stats {
  const o = { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, test: 0 };
  const m = { gross: 0, discounts: 0, refunds: 0, refundedProducts: 0, net: 0, awaitingPayment: 0, paidOrders: 0 };
  const sold = new Map<string, { id: string; name: string; units: number; revenue: number }>();
  for (const r of orders) {
    if (r.is_test) { o.test++; continue; }
    o.total++; if (r.status in o) (o as any)[r.status]++;
    const sub = Number(r.summary?.subtotal ?? 0), disc = Number(r.summary?.discount ?? 0) + Number(r.summary?.deal_discount ?? 0), total = Number(r.total ?? 0);
    if (r.payment_status === "paid" || r.payment_status === "refunded") {
      m.gross += sub; m.discounts += disc;
      if (r.payment_status === "paid") m.paidOrders++;
      else { m.refunds += total; m.refundedProducts += Math.max(sub - disc, 0); }
    } else if (r.status !== "cancelled") m.awaitingPayment += total;
    if (r.status !== "cancelled") for (const i of r.items ?? []) { const e = sold.get(i.product_id) ?? { id: i.product_id, name: i.name, units: 0, revenue: 0 }; e.units += Number(i.quantity) || 0; e.revenue += Number(i.line_total) || 0; sold.set(i.product_id, e); }
  }
  m.net = m.gross - m.discounts - m.refundedProducts;
  for (const k of Object.keys(m) as (keyof typeof m)[]) m[k] = r2(m[k]);
  const live = products.filter(p => p.is_active);
  return { orders: o, money: m, best: [...sold.values()].map(e => ({ ...e, revenue: r2(e.revenue) })).sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, 5),
    out: live.filter(p => p.stock <= 0), low: live.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_AT).sort((a, b) => a.stock - b.stock) };
}

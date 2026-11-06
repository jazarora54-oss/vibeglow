/** Customers are built from orders (no separate sign-up needed). Thresholds are shown on the page so they can be adjusted here. */
export const SEGMENTS = { vipOrders: 3, vipSpend: 150, inactiveDays: 90 };
export type Segment = "VIP" | "Repeat" | "New" | "Inactive";
export interface Customer { email: string; name: string; phone: string; orders: number; spent: number; first: string; last: string; avg: number; segment: Segment; marketing: boolean; city: string; state: string }
interface Row { email: string; customer_name: string | null; phone: string | null; total: number | string; created_at: string; status: string; is_test?: boolean | null; data?: any }
export function segmentOf(orders: number, spent: number, lastIso: string, now = Date.now()): Segment {
  if (orders >= SEGMENTS.vipOrders || spent >= SEGMENTS.vipSpend) return "VIP";
  if (now - new Date(lastIso).getTime() > SEGMENTS.inactiveDays * 864e5) return "Inactive";
  return orders >= 2 ? "Repeat" : "New";
}
/** Cancelled and test orders are not counted. `confirmed` = lowercase emails with a confirmed newsletter opt-in. */
export function buildCustomers(rows: Row[], confirmed: Set<string>, now = Date.now()): Customer[] {
  const m = new Map<string, Customer>();
  for (const r of rows) {
    if (r.status === "cancelled" || r.is_test) continue;
    const email = String(r.email).trim().toLowerCase(); if (!email) continue;
    const a = r.data?.checkout?.shipping_address; const c = m.get(email);
    if (!c) m.set(email, { email, name: r.customer_name ?? "", phone: r.phone ?? "", orders: 1, spent: Number(r.total) || 0, first: r.created_at, last: r.created_at, avg: 0, segment: "New", marketing: confirmed.has(email), city: a?.city ?? "", state: a?.state ?? "" });
    else { c.orders++; c.spent += Number(r.total) || 0; if (r.created_at < c.first) c.first = r.created_at; if (r.created_at > c.last) { c.last = r.created_at; c.name = r.customer_name || c.name; c.phone = r.phone || c.phone; c.city = a?.city ?? c.city; c.state = a?.state ?? c.state; } }
  }
  return [...m.values()].map(c => ({ ...c, spent: Math.round(c.spent * 100) / 100, avg: Math.round((c.spent / c.orders) * 100) / 100, segment: segmentOf(c.orders, c.spent, c.last, now) })).sort((x, y) => y.spent - x.spent);
}

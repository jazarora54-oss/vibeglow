import type { CartItem, Deal } from "@/types";
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A deal is live when it is inside its start / end dates (admin -> Deals). */
export const dealIsLive = (d: Deal, now = Date.now()) => (!d.starts_at || Date.parse(d.starts_at) <= now) && (!d.ends_at || Date.parse(d.ends_at) >= now);
const freeOrPct = (p: number) => p >= 100 ? "Free" : p === 50 ? "Half Price" : `${p}% Off`;
/** The words customers see, e.g. "Buy 2 Get 1 Free", "Buy 1 Get 1 Half Price", "20% Off". */
export const dealTitle = (d: Pick<Deal, "kind" | "buy_qty" | "get_qty" | "percent_off">) => d.kind === "percent" ? `${d.percent_off}% Off` : `Buy ${d.buy_qty} Get ${d.get_qty} ${freeOrPct(d.percent_off)}`;

export interface DealResult { total: number; byProduct: Record<string, number>; applied: { name: string; amount: number }[] }
type Unit = { pid: string; price: number; used: boolean };
const eligible = (d: Deal, u: Unit) => !u.used && (d.product_ids.length === 0 || d.product_ids.includes(u.pid));

/** What one deal would take off, and which units it would use up. Pure function: no state. */
function evaluate(d: Deal, units: Unit[]): { amount: number; hit: { u: Unit; off: number }[] } {
  const pool = units.filter(u => eligible(d, u)).sort((a, b) => a.price - b.price); // cheapest first
  if (d.kind === "percent") return { amount: pool.reduce((s, u) => s + u.price * d.percent_off / 100, 0), hit: pool.map(u => ({ u, off: u.price * d.percent_off / 100 })) };
  const group = d.buy_qty + d.get_qty; const groups = Math.floor(pool.length / group); if (groups < 1) return { amount: 0, hit: [] };
  const cheap = pool.slice(0, groups * d.get_qty);                      // the cheapest units get the discount
  const buy = pool.slice(cheap.length).reverse().slice(0, groups * d.buy_qty); // the units that "pay" for it are used up too
  return { amount: cheap.reduce((s, u) => s + u.price * d.percent_off / 100, 0), hit: [...cheap.map(u => ({ u, off: u.price * d.percent_off / 100 })), ...buy.map(u => ({ u, off: 0 }))] };
}

/**
 * Applies the live deals to a cart. One unit of a product only ever gets ONE deal (no stacking of deals on the same unit):
 * the deal that saves the customer the most goes first. Used by the cart, mini cart, checkout AND again on the server when the order is placed.
 */
export function calculateDeals(items: CartItem[], deals: Deal[] | undefined, now = Date.now()): DealResult {
  const out: DealResult = { total: 0, byProduct: {}, applied: [] };
  let left = (deals ?? []).filter(d => d && dealIsLive(d, now) && d.percent_off > 0 && d.percent_off <= 100);
  if (!left.length) return out;
  const units: Unit[] = items.flatMap(i => Array.from({ length: Math.max(0, Math.min(Math.floor(i.quantity), 99)) }, () => ({ pid: i.product_id, price: i.unit_price, used: false })));
  while (left.length) {
    let best: { d: Deal; r: ReturnType<typeof evaluate> } | null = null;
    for (const d of left) { const r = evaluate(d, units); if (r.amount > 0.004 && (!best || r.amount > best.r.amount)) best = { d, r }; }
    if (!best) break;
    let amount = 0; for (const { u, off } of best.r.hit) { u.used = true; if (off > 0) { amount += off; out.byProduct[u.pid] = (out.byProduct[u.pid] ?? 0) + off; } }
    out.applied.push({ name: dealTitle(best.d), amount: r2(amount) }); left = left.filter(x => x !== best!.d);
  }
  for (const k of Object.keys(out.byProduct)) out.byProduct[k] = r2(out.byProduct[k]);
  out.total = r2(out.applied.reduce((s, a) => s + a.amount, 0));
  return out;
}

/** Friendly nudges for the cart: "Add 1 more to get 1 Free". Only for "buy X get Y" deals the customer is close to. */
export function dealHints(items: CartItem[], deals: Deal[] | undefined, now = Date.now()): string[] {
  const out: string[] = [];
  for (const d of (deals ?? []).filter(x => x.kind === "buy_get" && dealIsLive(x, now))) {
    const n = items.filter(i => d.product_ids.length === 0 || d.product_ids.includes(i.product_id)).reduce((s, i) => s + i.quantity, 0);
    const rem = n % (d.buy_qty + d.get_qty);
    if (n > 0 && rem >= d.buy_qty) { const need = d.buy_qty + d.get_qty - rem; out.push(`Add ${need} more to get ${d.get_qty} ${freeOrPct(d.percent_off).toLowerCase()} (${dealTitle(d)})`); }
  }
  return out;
}

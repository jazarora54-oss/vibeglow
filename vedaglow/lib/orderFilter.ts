export const STATUS_LIST = ["pending", "processing", "shipped", "delivered", "cancelled"];
export const PAY_LIST = ["unpaid", "paid", "refunded"];
export interface OrderQuery { status: string; pay: string; q: string; from: string; to: string }
const ymd = (s?: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s ?? "") ? s! : "");
export function parseOrderQuery(p: Record<string, string | undefined>): OrderQuery {
  return { status: STATUS_LIST.includes(p.status ?? "") ? p.status! : "all", pay: PAY_LIST.includes(p.pay ?? "") ? p.pay! : "all", q: (p.q ?? "").trim().slice(0, 80), from: ymd(p.from), to: ymd(p.to) };
}
/** Adds the filters to a Supabase orders query. Search text is stripped of characters that have meaning in PostgREST filters. */
export function applyOrderQuery<T extends { eq: Function; or: Function; gte: Function; lt: Function }>(q: T, f: OrderQuery): T {
  let r: any = q;
  if (f.status !== "all") r = r.eq("status", f.status);
  if (f.pay !== "all") r = r.eq("payment_status", f.pay);
  if (f.q) { const t = f.q.replace(/[^\p{L}\p{N}@.\-_ ]/gu, "").trim(); if (t) r = r.or(`id.ilike.%${t}%,email.ilike.%${t}%,customer_name.ilike.%${t}%,invoice_no.ilike.%${t}%`); }
  if (f.from) r = r.gte("created_at", `${f.from}T00:00:00-05:00`);
  if (f.to) { const d = new Date(`${f.to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); r = r.lt("created_at", `${d.toISOString().slice(0, 10)}T00:00:00-05:00`); }
  return r;
}
export const orderQs = (f: OrderQuery) => { const u = new URLSearchParams(); (["status", "pay"] as const).forEach(k => f[k] !== "all" && u.set(k, f[k])); (["q", "from", "to"] as const).forEach(k => f[k] && u.set(k, f[k])); return u.toString(); };

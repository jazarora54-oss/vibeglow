/** Finds coupon codes written in a message (like WELCOME10 or FESTIVE20) and says whether customers could really use them. */
export const codesIn = (text: unknown): string[] => [...new Set((String(text ?? "").toUpperCase().match(/\b[A-Z]{3,}[0-9]{1,3}\b/g) ?? []))];
export interface CouponRow { code: string; is_active?: boolean; expires_at?: string | null; usage_limit?: number | null; used_count?: number | null }
/** "" = the code works. Otherwise a plain sentence about what is wrong. */
export function couponProblem(code: string, rows: CouponRow[], now = Date.now()): string {
  const r = rows.find(x => String(x.code).toUpperCase() === code.toUpperCase());
  if (!r) return `${code} is not in admin → Coupons. Create it there, otherwise customers see “invalid”.`;
  if (r.is_active === false) return `${code} exists but is switched OFF in admin → Coupons.`;
  if (r.expires_at && Date.parse(r.expires_at) <= now) return `${code} has expired. Edit its date in admin → Coupons.`;
  if (r.usage_limit != null && (r.used_count ?? 0) >= r.usage_limit) return `${code} is used up (${r.used_count ?? 0}/${r.usage_limit}). Raise the usage limit in admin → Coupons.`;
  return "";
}

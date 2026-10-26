import PromoForm from "@/components/admin/PromoForm";
import { getSiteSettings } from "@/lib/data/site";
import { serverClient } from "@/lib/supabase/server";
import { codesIn, couponProblem, type CouponRow } from "@/lib/couponCheck";
export default async function Page() {
  const s = await getSiteSettings();
  let warn: string[] = [];
  try { const { data } = await serverClient().from("coupons").select("code,is_active,expires_at,usage_limit,used_count"); const rows = (data ?? []) as CouponRow[];
    warn = [...new Set([...codesIn(s.topbar_text), ...codesIn(s.popup_title), ...codesIn(s.popup_message), ...codesIn(s.popup_code), ...codesIn(s.newsletter_text), ...codesIn(s.newsletter_code)])].map(c => couponProblem(c, rows)).filter(Boolean); } catch { /* coupons table not readable: no warning */ }
  return <div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Popup &amp; Top bar</h1>
    <p className="text-sm text-ink/60">Write your own message for the strip at the very top of the website, and a pop-up that welcomes visitors with a message and a coupon code. Changes go live as soon as you save.</p>
    {warn.length > 0 && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="mb-1 font-semibold">⚠ A coupon code in your messages will not work for customers:</p><ul className="list-disc pl-5">{warn.map(w => <li key={w}>{w}</li>)}</ul></div>}
    <PromoForm initial={{ topbar_text: s.topbar_text, topbar_bg: s.topbar_bg, topbar_link: s.topbar_link, topbar_starts: s.topbar_starts, topbar_ends: s.topbar_ends, topbar_show_shipping: s.topbar_show_shipping, popup_enabled: s.popup_enabled, popup_title: s.popup_title, popup_message: s.popup_message, popup_code: s.popup_code, popup_button_text: s.popup_button_text, popup_button_link: s.popup_button_link, popup_delay: s.popup_delay, newsletter_title: s.newsletter_title, newsletter_text: s.newsletter_text, newsletter_code: s.newsletter_code }} /></div>;
}

import { serverClient } from "@/lib/supabase/server";
import { emailConfigured, marketingEnabled } from "@/lib/email";
import { fmtDateTime } from "@/lib/format";
import { card } from "@/components/admin/ui";
import TestEmailButton from "@/components/admin/TestEmailButton";
const KIND: Record<string, string> = { order_confirmation: "Order confirmation", admin_new_order: "New order (to you)", order_status: "Order status", refund: "Refund", newsletter_confirm: "Newsletter confirm", welcome: "Welcome", test: "Test" };
export default async function Page() {
  const { data, error } = await serverClient().from("email_log").select("id,created_at,kind,to_email,subject,ok,error").order("created_at", { ascending: false }).limit(100);
  const row = (ok: boolean, l: string, d: string) => <li className="flex items-start gap-3 py-2 text-sm"><span className={`mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{ok ? "ON" : "OFF"}</span><span><b>{l}</b><br /><span className="text-ink/60">{d}</span></span></li>;
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Emails</h1>
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Status</h2><ul className="divide-y divide-forest/10">
      {row(emailConfigured(), "Order emails (confirmation, shipped, cancelled, refund)", emailConfigured() ? "Resend is connected. Customers get these automatically." : "Not sent yet: add RESEND_API_KEY in Netlify to switch on.")}
      {row(marketingEnabled(), "Promotional emails (offers)", marketingEnabled() ? "Switched on by MARKETING_EMAILS_ENABLED=true. Only people who opted in are emailed, each with an unsubscribe link." : "Switched OFF for safety. Turn on only with a verified business sending domain and customer consent.")}</ul>
      <div className="mt-4"><TestEmailButton /></div></section>
    <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Last 100 emails</h2>
      {error ? <p className="text-sm text-red-800">{/email_log/.test(error.message) ? "Run supabase/migration-11.sql in Supabase to see the log." : error.message}</p> : (data ?? []).length === 0 ? <p className="text-sm text-ink/60">Nothing sent yet.</p> :
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs uppercase text-ink/60"><tr><th className="p-2">When</th><th className="p-2">Type</th><th className="p-2">To</th><th className="p-2">Subject</th><th className="p-2">Result</th></tr></thead><tbody className="divide-y divide-forest/10">
          {(data ?? []).map(r => <tr key={r.id}><td className="p-2 text-ink/70">{fmtDateTime(r.created_at)}</td><td className="p-2">{KIND[r.kind] ?? r.kind}</td><td className="p-2">{r.to_email}</td><td className="p-2">{r.subject}</td><td className="p-2">{r.ok ? "Sent" : <span className="text-red-700">Failed{r.error ? `: ${r.error}` : ""}</span>}</td></tr>)}</tbody></table></div>}</section></div>);
}

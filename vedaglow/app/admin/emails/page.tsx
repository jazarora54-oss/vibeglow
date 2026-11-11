import { serverClient } from "@/lib/supabase/server";
import { emailConfigured, emailProvider, marketingEnabled } from "@/lib/email";
import { fmtDateTime } from "@/lib/format";
import { card } from "@/components/admin/ui";
import EmailRowActions from "@/components/admin/EmailRowActions";
import Link from "next/link";
import TestEmailButton from "@/components/admin/TestEmailButton";
const KIND: Record<string, string> = { order_confirmation: "Order confirmation", admin_new_order: "New order (to you)", order_status: "Order status", refund: "Refund", newsletter_confirm: "Newsletter confirm", welcome: "Welcome", test: "Test", invoice: "Invoice", refund_admin: "Refund (to you)", contact_notify: "Inquiry (to you)", contact_ack: "Inquiry receipt", contact_reply: "Reply to customer" };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f = "" } = await searchParams; const db = serverClient();
  const term = q.trim().replace(/[%,()]/g, "").slice(0, 80);
  let qb = db.from("email_log").select("id,created_at,kind,to_email,subject,ok,error,html,attempts,order_id").order("created_at", { ascending: false }).limit(100);
  if (f === "failed") qb = qb.eq("ok", false); if (f === "sent") qb = qb.eq("ok", true);
  if (term) qb = qb.or(`to_email.ilike.%${term}%,subject.ilike.%${term}%,order_id.eq.${/^[0-9a-f-]{36}$/i.test(term) ? term : "00000000-0000-0000-0000-000000000000"}`);
  const [{ data, error }, tot, okc, bad] = await Promise.all([qb, db.from("email_log").select("id", { count: "exact", head: true }), db.from("email_log").select("id", { count: "exact", head: true }).eq("ok", true), db.from("email_log").select("id", { count: "exact", head: true }).eq("ok", false)]);
  const row = (ok: boolean, l: string, d: string) => <li className="flex items-start gap-3 py-2 text-sm"><span className={`mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{ok ? "ON" : "OFF"}</span><span><b>{l}</b><br /><span className="text-ink/60">{d}</span></span></li>;
  return (<div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Email Management</h1><Link href="/admin/business-email" className="text-sm font-semibold text-forest underline">Business email settings →</Link></div>
    <div className="grid gap-3 sm:grid-cols-3">{[["Total logged", tot.count ?? 0], ["Delivered to provider", okc.count ?? 0], ["Failed", bad.count ?? 0]].map(([l, n]) => <div key={String(l)} className={card}><p className="text-xs font-semibold uppercase text-ink/60">{l}</p><p className="font-display text-3xl font-semibold text-forest">{n}</p></div>)}</div>
    <p className="text-xs text-ink/60">Emails are sent immediately, so there is no “pending” queue. “Delivered to provider” means Gmail/Resend accepted the message; it cannot prove the inbox received it.</p>
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Status</h2><ul className="divide-y divide-forest/10">
      {row(emailConfigured(), "Order, invoice and inquiry emails", emailConfigured() ? `Connected via ${emailProvider() === "gmail" ? "Gmail / SMTP" : "Resend"}. Customers get these automatically.` : "Not sent yet: add GMAIL_APP_PASSWORD (or RESEND_API_KEY) in Netlify, then redeploy.")}
      {row(marketingEnabled(), "Promotional emails (offers)", marketingEnabled() ? "Switched on by MARKETING_EMAILS_ENABLED=true. Only people who opted in are emailed, each with an unsubscribe link." : "Switched OFF for safety. Turn on only with a verified business sending domain and customer consent.")}</ul>
      <div className="mt-4"><TestEmailButton /></div></section>
    <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Email history</h2>
      <form className="mb-3 flex flex-wrap gap-2" role="search"><input name="q" defaultValue={q} placeholder="Customer email, subject or order ID" aria-label="Search emails" className="min-w-[220px] flex-1 rounded-lg border border-forest/20 px-3 py-2 text-sm" /><select name="f" defaultValue={f} aria-label="Filter" className="rounded-lg border border-forest/20 px-3 py-2 text-sm"><option value="">All</option><option value="sent">Delivered</option><option value="failed">Failed</option></select><button className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-onforest">Search</button></form>
      {error ? <p className="text-sm text-red-800">{/email_log|html|attempts/.test(error.message) ? "Run supabase/migration-14.sql in Supabase to see the log." : error.message}</p> : (data ?? []).length === 0 ? <p className="text-sm text-ink/60">Nothing sent yet.</p> :
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs uppercase text-ink/60"><tr><th className="p-2">When</th><th className="p-2">Type</th><th className="p-2">To</th><th className="p-2">Subject</th><th className="p-2">Result</th><th className="p-2"></th></tr></thead><tbody className="divide-y divide-forest/10">
          {(data ?? []).map(r => <tr key={r.id}><td className="p-2 text-ink/70">{fmtDateTime(r.created_at)}</td><td className="p-2">{KIND[r.kind] ?? r.kind}</td><td className="p-2">{r.to_email}</td><td className="p-2">{r.subject}</td><td className="p-2">{r.ok ? "Delivered" : <span className="text-red-700">Failed{r.error ? `: ${r.error}` : ""}</span>}</td><td className="p-2"><EmailRowActions id={r.id} failed={!r.ok} html={r.html} /></td></tr>)}</tbody></table></div>}</section></div>);
}

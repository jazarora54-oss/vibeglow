import { serverClient } from "@/lib/supabase/server";
import { card } from "@/components/admin/ui";
export const dynamic = "force-dynamic";
export default async function Page() {
  const sb = serverClient();
  const [{ data, error }, { count: active }] = await Promise.all([sb.from("newsletter_subscribers").select("email,unsubscribed,created_at").order("created_at", { ascending: false }).limit(300), sb.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("unsubscribed", false)]);
  return (<div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Newsletter subscribers</h1><a href="/admin/subscribers/export" className="rounded-lg border border-forest/25 bg-white px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-100">Download CSV (subscribed only)</a></div>
    <p className="text-sm text-ink/60">People who typed their email in the homepage box. <b>{active ?? 0}</b> currently subscribed. Only send marketing email to people on this list who have not unsubscribed. Every welcome email already has an unsubscribe link.</p>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}. Run supabase/migration-8.sql in Supabase → SQL Editor.</p>}
    {!error && (data ?? []).length === 0 ? <p className={`${card} text-sm text-ink/60`}>No subscribers yet.</p> : <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Email</th><th className="p-3">Signed up</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-forest/10">{(data ?? []).map(r => <tr key={r.email}><td className="p-3">{r.email}</td><td className="p-3">{new Date(r.created_at).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" })}</td><td className="p-3">{r.unsubscribed ? <span className="text-ink/50">Unsubscribed</span> : <span className="font-semibold text-green-700">Subscribed</span>}</td></tr>)}</tbody></table></div>}
  </div>);
}

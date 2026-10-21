import { serverClient } from "@/lib/supabase/server";
import { card } from "@/components/admin/ui";
export default async function Page() {
  const { data, error } = await serverClient().from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Activity log</h1>
    <p className="text-sm text-ink/60">Who changed what in the admin (the last 200 actions). Entries cannot be edited or deleted. Times are shown in Pacific time.</p>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}. Run supabase/migration-6.sql in Supabase → SQL Editor to switch the activity log on.</p>}
    {!error && rows.length === 0 ? <p className={`${card} text-sm text-ink/60`}>Nothing recorded yet. Changes you make from now on will appear here.</p> :
      <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Details</th></tr></thead>
        <tbody className="divide-y divide-forest/10">{rows.map(r => <tr key={r.id}><td className="whitespace-nowrap p-3">{new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })}</td><td className="p-3">{r.user_email ?? "—"}</td><td className="p-3 font-semibold">{r.action}</td><td className="p-3 text-ink/70">{r.detail}</td></tr>)}</tbody></table></div>}
  </div>);
}

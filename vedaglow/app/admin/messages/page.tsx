import { serverClient } from "@/lib/supabase/server";
import MessageRow, { type Msg } from "@/components/admin/MessageRow";
export default async function Page() {
  const { data, error } = await serverClient().from("messages").select("*").order("created_at", { ascending: false }).limit(200); const ms = (data ?? []) as Msg[];
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Customer messages</h1>
    <p className="text-sm text-ink/60">Messages sent from the Contact page. Press “Reply by email” to answer from your own email app.</p>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}. Did you run supabase/migration-2.sql?</p>}
    {ms.length === 0 && !error ? <p className="rounded-2xl border border-forest/10 bg-white p-6 text-sm text-ink/60 shadow-card">No messages yet.</p> : <div className="space-y-3">{ms.map(m => <MessageRow key={m.id} m={m} />)}</div>}</div>);
}

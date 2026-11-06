import Link from "next/link";
import { notFound } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateTime, money } from "@/lib/format";
import { STATUS_STYLE, card } from "@/components/admin/ui";
import CustomerNote from "@/components/admin/CustomerNote";
import { buildCustomers } from "@/lib/customers";
export default async function Page(props: { params: Promise<{ email: string }> }) {
  const email = decodeURIComponent((await props.params).email).trim().toLowerCase(); if (!email.includes("@") || email.length > 160) notFound();
  const sb = serverClient(); const safe = email.replace(/[%_\\]/g, "\\$&");
  const [{ data: ords }, { data: note }, { data: sub }] = await Promise.all([sb.from("orders").select("id,created_at,status,payment_status,total,email,customer_name,phone,data").ilike("email", safe).order("created_at", { ascending: false }).limit(500),
    sb.from("customer_notes").select("note,tags").eq("email", email).maybeSingle(), sb.from("newsletter_subscribers").select("confirmed_at,unsubscribed").eq("email", email).maybeSingle()]);
  if (!ords || ords.length === 0) notFound();
  const marketing = Boolean(sub?.confirmed_at) && !sub?.unsubscribed;
  const c = buildCustomers(ords as any, new Set(marketing ? [email] : []))[0];
  return (<div className="space-y-5"><Link href="/admin/customers" className="text-sm font-semibold text-forest underline">← All customers</Link>
    <h1 className="font-display text-4xl font-semibold text-forest">{ords[0].customer_name || email}</h1><p className="text-sm text-ink/60">{email}{ords[0].phone ? ` · ${ords[0].phone}` : ""}</p>
    <div className="grid gap-3 sm:grid-cols-4">{[["Segment", c?.segment ?? "—"], ["Orders", String(c?.orders ?? 0)], ["Total spent", money(c?.spent ?? 0)], ["Avg order", money(c?.avg ?? 0)]].map(([k, v]) => <div key={k} className={card}><p className="text-xs uppercase text-ink/60">{k}</p><p className="text-2xl font-semibold text-forest">{v}</p></div>)}</div>
    <p className="text-sm">Marketing emails: <b>{marketing ? "Confirmed opt-in" : "No consent on record – do not send promotions"}</b>{c ? ` · Customer since ${fmtDate(c.first)}` : ""}</p>
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]"><section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Orders</h2><ul className="divide-y divide-forest/10">{ords.map(o => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><Link href={`/admin/orders/${o.id}`} className="font-bold text-forest hover:underline">{o.id}</Link><span className="text-ink/60">{fmtDateTime(o.created_at)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[o.status] ?? ""}`}>{o.status}</span><b>{money(Number(o.total))}</b></li>)}</ul></section>
      <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Notes</h2><CustomerNote email={email} note={note?.note ?? ""} tags={note?.tags ?? []} /></section></div></div>);
}

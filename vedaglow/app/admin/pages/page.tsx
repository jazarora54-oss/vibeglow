import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { DEFAULT_PAGES, PAGE_SLUGS } from "@/lib/data/defaults";
import { card } from "@/components/admin/ui";
export default async function Page() {
  const { data } = await serverClient().from("pages").select("slug,updated_at"); const saved = new Map((data ?? []).map(r => [r.slug as string, r.updated_at as string]));
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Pages</h1>
    <p className="text-sm text-ink/60">About, Contact, Shipping, Returns, Refunds, Privacy, Terms and the FAQ intro. They are already filled with a <b>draft</b>. Open one, adjust it to your real policy, and save. Changes go live immediately.</p>
    <div className="grid gap-3 sm:grid-cols-2">{PAGE_SLUGS.map(s => <Link key={s} href={`/admin/pages/${s}`} className={`${card} flex items-center justify-between hover:border-forest/40`}><span><b className="text-forest">{DEFAULT_PAGES[s].title}</b><br /><span className="text-xs text-ink/50">/{s}</span></span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${saved.has(s) ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{saved.has(s) ? "Edited" : "Draft"}</span></Link>)}</div></div>);
}

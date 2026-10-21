import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import ReviewManager, { type ReviewRow } from "@/components/admin/ReviewManager";
export const dynamic = "force-dynamic";
const TABS = [["pending", "Waiting for approval"], ["approved", "Approved (public)"], ["rejected", "Rejected"]] as const;
export default async function Page({ searchParams }: { searchParams: { status?: string } }) {
  const status = (TABS.map(t => t[0]) as string[]).includes(searchParams.status ?? "") ? searchParams.status! : "pending";
  const sb = serverClient();
  const [{ data, error }, { data: prods }, counts] = await Promise.all([sb.from("reviews").select("*").eq("status", status).order("created_at", { ascending: false }).limit(200), sb.from("products").select("id,name").limit(3000),
    Promise.all(TABS.map(t => sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", t[0])))]);
  const names = new Map((prods ?? []).map(p => [p.id, p.name]));
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Customer reviews</h1>
    <p className="text-sm text-ink/60">Only reviews you <b>approve</b> appear on the website. Star ratings on products are worked out from approved reviews only. No review is ever made up by the website.</p>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error.message}. Run supabase/migration-8.sql in Supabase → SQL Editor.</p>}
    <div className="flex flex-wrap gap-2">{TABS.map(([k, l], i) => <Link key={k} href={`/admin/reviews?status=${k}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === k ? "bg-forest text-white" : "border border-forest/20 bg-white text-forest"}`}>{l} ({counts[i].count ?? 0})</Link>)}</div>
    <ReviewManager rows={((data ?? []) as any[]).map(r => ({ id: r.id, product: names.get(r.product_id) ?? r.product_id, name: r.customer_name, email: r.email, rating: r.rating, body: r.body, verified: r.verified, status: r.status, reply: r.admin_reply ?? "", created_at: r.created_at })) as ReviewRow[]} />
  </div>);
}

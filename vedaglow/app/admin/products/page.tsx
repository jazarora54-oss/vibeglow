import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { card, btn } from "@/components/admin/ui";
import { ImportDemo, ToggleActive } from "@/components/admin/ProductRowActions";
import { BulkBar, CsvImport, SelectAll } from "@/components/admin/ProductBulkTools";
import { DEFAULT_CATEGORIES, rowToCategory } from "@/lib/data/categories";
import { money } from "@/lib/format";
import type { TemporaryOrder } from "@/types";
export default async function Page({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = (searchParams.q ?? "").trim().replace(/[%,()]/g, "");
  const sb = serverClient();
  let query = sb.from("products").select("id,slug,name,category,price,stock,is_active,images").order("created_at", { ascending: false });
  const cat = (searchParams.category ?? "").replace(/[^a-z0-9-]/g, "").slice(0, 60);
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  if (cat) query = query.eq("category", cat);
  const [{ data, error }, stats, ords, { data: catRows }] = await Promise.all([query, sb.rpc("product_stats"), sb.from("orders").select("status,data").neq("status", "cancelled").limit(3000), sb.from("categories").select("*").order("sort_order")]);
  const cats = (catRows ?? []).length ? (catRows ?? []).map(rowToCategory) : DEFAULT_CATEGORIES; const catName = new Map(cats.map(c => [c.slug, c.name]));
  const ps = data ?? [];
  const st = new Map<string, { v: number; w: number }>((stats.data ?? []).map((r: any) => [r.product_id, { v: Number(r.views_30d), w: Number(r.watchers) }]));
  const sold = new Map<string, number>(); for (const o of ords.data ?? []) for (const i of ((o.data as TemporaryOrder)?.items ?? [])) sold.set(i.product_id, (sold.get(i.product_id) ?? 0) + i.quantity);
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Products</h1><div className="flex flex-wrap items-center gap-2"><a href="/admin/products/export" className="rounded-lg border border-forest/25 bg-white px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-100">Export CSV</a><Link href="/admin/products/new" className={btn}>+ Add product</Link></div><CsvImport /></div>
    <form className="flex flex-wrap gap-2"><select name="category" defaultValue={cat} aria-label="Filter by category" className="rounded-lg border border-forest/20 bg-white px-3 py-2 text-sm"><option value="">All categories</option>{cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select><input name="q" defaultValue={q} placeholder="Search name or SKU" className="w-full max-w-sm rounded-lg border border-forest/20 bg-white px-3 py-2 text-sm" /><button className="rounded-lg border border-forest/25 bg-white px-4 text-sm font-semibold text-forest">Search</button></form>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Could not load products: {error.message}. Did you run supabase/schema.sql?</p>}
    {stats.error && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Views and watchers need supabase/migration-4.sql (run it once in the SQL Editor).</p>}
    {!q && ps.length === 0 && !error && <div className={card}><p className="font-semibold">No products in the database yet.</p><p className="mb-3 mt-1 text-sm text-ink/70">Start with the 12 demo products and edit them, or add your own.</p><ImportDemo /></div>}
    {ps.length > 0 && <BulkBar categories={cats.map(c => ({ slug: c.slug, name: c.name }))} />}
    {ps.length > 0 && <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3"><SelectAll /></th><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3" title="Product page views in the last 30 days">Views (30d)</th><th className="p-3" title="Visitors who hearted this product">Watchers</th><th className="p-3" title="Units sold (not cancelled)">Sold</th><th className="p-3">Status</th></tr></thead>
      <tbody className="divide-y divide-forest/10">{ps.map(p => { const s = st.get(p.id); return <tr key={p.id} className="hover:bg-cream/60"><td className="p-3"><input type="checkbox" name="ids" value={p.id} form="bulk-form" aria-label={`Select ${p.name}`} className="h-4 w-4 accent-forest" /></td><td className="p-3"><Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-semibold text-forest hover:underline">{p.images?.[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-contain" /> : <span className="h-10 w-10 rounded bg-cream-dark" />}{p.name}</Link></td><td className="p-3">{catName.get(p.category) ?? <span className="text-amber-700" title="This category is not in your category list">{p.category}</span>}</td><td className="p-3">{money(Number(p.price))}</td><td className={`p-3 font-semibold ${p.stock <= 0 ? "text-red-700" : p.stock <= 5 ? "text-amber-700" : ""}`}>{p.stock}</td><td className="p-3">{s?.v ?? 0}</td><td className="p-3">{s?.w ?? 0}</td><td className="p-3">{sold.get(p.id) ?? 0}</td><td className="p-3"><ToggleActive id={p.id} active={p.is_active} /></td></tr>; })}</tbody></table></div>}
  </div>);
}

import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { card, btn } from "@/components/admin/ui";
import { ImportDemo, ToggleActive } from "@/components/admin/ProductRowActions";
import { money } from "@/lib/format";
export default async function Page({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim().replace(/[%,()]/g, "");
  let query = serverClient().from("products").select("id,slug,name,category,price,stock,is_active,images").order("created_at", { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  const { data, error } = await query; const ps = data ?? [];
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Products</h1><Link href="/admin/products/new" className={btn}>+ Add product</Link></div>
    <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search name or SKU" className="w-full max-w-sm rounded-lg border border-forest/20 bg-white px-3 py-2 text-sm" /><button className="rounded-lg border border-forest/25 bg-white px-4 text-sm font-semibold text-forest">Search</button></form>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Could not load products: {error.message}. Did you run supabase/schema.sql?</p>}
    {!q && ps.length === 0 && !error && <div className={card}><p className="font-semibold">No products in the database yet.</p><p className="mb-3 mt-1 text-sm text-ink/70">Start with the 12 demo products and edit them, or add your own.</p><ImportDemo /></div>}
    {ps.length > 0 && <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th></tr></thead>
      <tbody className="divide-y divide-forest/10">{ps.map(p => <tr key={p.id} className="hover:bg-cream/60"><td className="p-3"><Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-semibold text-forest hover:underline">{p.images?.[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-contain" /> : <span className="h-10 w-10 rounded bg-cream-dark" />}{p.name}</Link></td><td className="p-3 capitalize">{p.category.replace("-", " ")}</td><td className="p-3">{money(Number(p.price))}</td><td className={`p-3 font-semibold ${p.stock <= 0 ? "text-red-700" : p.stock <= 5 ? "text-amber-700" : ""}`}>{p.stock}</td><td className="p-3"><ToggleActive id={p.id} active={p.is_active} /></td></tr>)}</tbody></table></div>}
  </div>);
}

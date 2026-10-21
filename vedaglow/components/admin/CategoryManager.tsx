"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCategory, moveCategory, saveCategory, seedCategories, type CategoryInput } from "@/app/admin/actions";
import { slugify } from "@/lib/data/mappers";
import type { StoreCategory } from "@/types";
import ImageUploader from "./ImageUploader";
import { btn, btn2, btnDanger, card, inp, lbl } from "./ui";
const blank = (n: number): CategoryInput => ({ name: "", slug: "", blurb: "", image_url: "", sort_order: n, is_active: true, seo_title: "", seo_description: "" });
export default function CategoryManager({ categories, builtIn, counts, dbError }: { categories: StoreCategory[]; builtIn: StoreCategory[]; counts: Record<string, number>; dbError?: string }) {
  const [edit, setEdit] = useState<CategoryInput | null>(null); const [slugTouched, setSlugTouched] = useState(false); const [msg, setMsg] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) => setEdit(e => e && ({ ...e, [k]: v }));
  const open = (c: StoreCategory) => { setEdit({ id: c.id, name: c.name, slug: c.slug, blurb: c.blurb, image_url: c.image_url ?? "", sort_order: c.sort_order, is_active: c.is_active, seo_title: c.seo_title ?? "", seo_description: c.seo_description ?? "" }); setSlugTouched(true); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const run = (f: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) => start(async () => { const r = await f(); if (!r.ok) { setMsg(r.message ?? "Failed"); return; } setMsg(""); after?.(); router.refresh(); });
  const list = categories.length ? categories : builtIn;
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Categories</h1>{!edit && categories.length > 0 && <button className={btn} onClick={() => { setEdit(blank((categories.length + 1) * 10)); setSlugTouched(false); setMsg(""); }}>+ Add category</button>}</div>
    <p className="text-sm text-ink/60">These control the menu, the footer, the filters and the “shop by category” circles. A category only appears on the website while it is switched on <b>and</b> has at least one visible product.</p>
    {dbError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{dbError}. Run supabase/migration-7.sql in Supabase → SQL Editor.</p>}
    {msg && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">⚠ {msg}</p>}
    {categories.length === 0 && !dbError && <section className={card}><p className="font-semibold">You are using the 5 built-in categories.</p><p className="mb-3 mt-1 text-sm text-ink/70">Save them to the database once, then you can rename them, add images and SEO text, reorder them and add new ones.</p><button className={btn} disabled={pending} onClick={() => run(seedCategories)}>{pending ? "Saving…" : "Save built-in categories & start editing"}</button></section>}
    {edit && <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">{edit.id ? "Edit category" : "New category"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={lbl} htmlFor="cn">Name *</label><input id="cn" className={inp} maxLength={60} value={edit.name} onChange={e => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></div>
        <div><label className={lbl} htmlFor="cs">URL name</label><input id="cs" className={inp} value={edit.slug} onChange={e => { setSlugTouched(true); set("slug", e.target.value); }} /><p className="mt-1 text-xs text-ink/50">/category/{slugify(edit.slug || edit.name) || "…"}{edit.id ? " · changing it moves the products along, but the old web address stops working." : ""}</p></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="cb">Description (shown at the top of the category page)</label><textarea id="cb" rows={2} maxLength={300} className={inp} value={edit.blurb} onChange={e => set("blurb", e.target.value)} /></div>
        <div><span className={lbl}>Image (round picture on the homepage)</span><ImageUploader value={edit.image_url ? [edit.image_url] : []} onChange={v => set("image_url", v[0] ?? "")} folder="categories" multiple={false} /></div>
        <div className="grid content-start gap-4"><div><label className={lbl} htmlFor="co">Order (smaller = earlier)</label><input id="co" type="number" min={0} className={inp} value={edit.sort_order} onChange={e => set("sort_order", Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={edit.is_active} onChange={e => set("is_active", e.target.checked)} />Switched on (visible on the website)</label></div>
        <div className="sm:col-span-2 rounded-xl border border-forest/10 bg-cream p-4"><p className="truncate text-lg text-blue-700">{edit.seo_title?.trim() || `${edit.name || "Category"} | VEDAGLOW`}</p><p className="truncate text-xs text-green-700">your-website › category › {slugify(edit.slug || edit.name) || "…"}</p><p className="mt-1 text-sm text-ink/70">{edit.seo_description?.trim() || edit.blurb || "Shop this category at VEDAGLOW."}</p></div>
        <div><label className={lbl} htmlFor="ct">Google title <span className="font-normal normal-case">({(edit.seo_title ?? "").length}/60)</span></label><input id="ct" className={inp} maxLength={120} value={edit.seo_title ?? ""} onChange={e => set("seo_title", e.target.value)} placeholder="Empty = category name + VEDAGLOW" /></div>
        <div><label className={lbl} htmlFor="cd">Google description <span className="font-normal normal-case">({(edit.seo_description ?? "").length}/160)</span></label><input id="cd" className={inp} maxLength={320} value={edit.seo_description ?? ""} onChange={e => set("seo_description", e.target.value)} placeholder="Empty = the description above" /></div></div>
      <div className="mt-5 flex flex-wrap gap-3"><button className={btn} disabled={pending} onClick={() => run(() => saveCategory(edit), () => setEdit(null))}>{pending ? "Saving…" : "Save category"}</button><button className={btn2} onClick={() => { setEdit(null); setMsg(""); }}>Cancel</button></div></section>}
    <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-card"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-cream-dark text-xs uppercase tracking-wide text-ink/60"><tr><th className="p-3">Category</th><th className="p-3">Products</th><th className="p-3">Status</th><th className="p-3">Order</th><th className="p-3" /></tr></thead>
      <tbody className="divide-y divide-forest/10">{list.map((c, i) => { const n = counts[c.slug] ?? 0; const saved = categories.length > 0; return <tr key={c.id}><td className="p-3"><b>{c.name}</b><br /><span className="text-xs text-ink/50">/category/{c.slug}</span></td>
        <td className="p-3">{n > 0 ? <Link href={`/admin/products?category=${c.slug}`} className="font-semibold text-forest underline">{n}</Link> : <span className="text-ink/50">0 (hidden on website)</span>}</td>
        <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{c.is_active ? "On" : "Off"}</span></td>
        <td className="p-3">{saved && <span className="flex gap-1"><button aria-label={`Move ${c.name} up`} className={btn2} disabled={pending || i === 0} onClick={() => run(() => moveCategory(c.id, -1))}>↑</button><button aria-label={`Move ${c.name} down`} className={btn2} disabled={pending || i === list.length - 1} onClick={() => run(() => moveCategory(c.id, 1))}>↓</button></span>}</td>
        <td className="flex flex-wrap gap-2 p-3">{saved && <><button className={btn2} onClick={() => open(c)}>Edit</button><button className={btnDanger} disabled={pending} onClick={() => confirm(`Delete “${c.name}”?`) && run(() => deleteCategory(c.id))}>Delete</button></>}</td></tr>; })}</tbody></table></div>
  </div>);
}

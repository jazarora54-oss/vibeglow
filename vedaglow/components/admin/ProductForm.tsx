"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { CATEGORY_OPTIONS } from "@/lib/shop";
import { slugify, type ProductInput } from "@/lib/data/mappers";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import ImageUploader from "./ImageUploader";
import { btn, btn2, btnDanger, card, inp, lbl } from "./ui";

export const emptyProduct = (): ProductInput => ({ id: "", slug: "", name: "", short_description: "", category: "skin-care", price: 0, images: [], visual: { kind: "bottle", label: "", color: "#E9D2B4" }, tags: [], stock: 0, is_active: true });
const TAGS: Product["tags"][number][] = ["new", "best-seller", "featured", "sale"];
const KINDS = ["bottle", "jar", "tube", "dropper", "pump"] as const;
const TEXTS: [keyof ProductInput, string][] = [["description", "Description"], ["benefits", "Benefits"], ["ingredients", "Ingredients"], ["how_to_use", "How to use"], ["size_quantity", "Size / quantity note"], ["shipping_info", "Shipping info"], ["return_info", "Return info"]];

export default function ProductForm({ initial, isNew }: { initial: ProductInput; isNew: boolean }) {
  const [p, setP] = useState<ProductInput>(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const [slugTouched, setSlugTouched] = useState(!isNew); const router = useRouter();
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP(x => ({ ...x, [k]: v }));
  const variants = p.variants ?? [];
  const setVar = (i: number, patch: Partial<ProductVariant>) => set("variants", variants.map((v, k) => k === i ? { ...v, ...patch } : v));
  const addVar = () => set("variants", [...variants, { id: `v_${Date.now().toString(36)}`, sku: "", label: "", price: p.price || 0, stock: 0 }]);
  const save = () => start(async () => {
    setMsg(null);
    if (variants.some(v => !v.label.trim())) { setMsg({ ok: false, t: "Every variant needs a label (e.g. 15ml)." }); return; }
    const r = await saveProduct({ ...p, slug: slugify(p.slug || p.name) });
    if (!r.ok) { setMsg({ ok: false, t: r.message ?? "Could not save." }); return; }
    setMsg({ ok: true, t: "Saved. Changes are live on the website." });
    if (isNew) router.replace(`/admin/products/${r.id}`); else router.refresh();
  });
  const del = () => { if (!confirm(`Delete “${p.name}” permanently? This cannot be undone. (Tip: you can just turn it off with “Visible on website”.)`)) return; start(async () => { const r = await deleteProduct(p.id); if (r.ok) router.push("/admin/products"); else setMsg({ ok: false, t: r.message ?? "Could not delete." }); }); };
  return (
    <div className="space-y-5">
      <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={lbl} htmlFor="n">Product name *</label><input id="n" className={inp} value={p.name} onChange={e => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></div>
          <div><label className={lbl} htmlFor="s">URL slug</label><input id="s" className={inp} value={p.slug} onChange={e => { setSlugTouched(true); set("slug", e.target.value); }} /><p className="mt-1 text-xs text-ink/50">/product/{slugify(p.slug || p.name) || "…"}</p></div>
          <div><label className={lbl} htmlFor="c">Category</label><select id="c" className={inp} value={p.category} onChange={e => set("category", e.target.value as Product["category"])}>{CATEGORY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
          <div className="sm:col-span-2"><label className={lbl} htmlFor="sd">Short description</label><input id="sd" className={inp} value={p.short_description} onChange={e => set("short_description", e.target.value)} /></div>
          <div><label className={lbl} htmlFor="b">Brand</label><input id="b" className={inp} value={p.brand ?? ""} onChange={e => set("brand", e.target.value)} /></div>
          <div><label className={lbl} htmlFor="pt">Product type (e.g. Face Wash)</label><input id="pt" className={inp} value={p.product_type ?? ""} onChange={e => set("product_type", e.target.value)} /></div>
        </div></section>

      <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">Price &amp; stock</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <div><label className={lbl} htmlFor="pr">Price (USD) *</label><input id="pr" type="number" min={0} step="0.01" className={inp} value={p.price} onChange={e => set("price", e.target.value === "" ? ("" as unknown as number) : Number(e.target.value))} /></div>
          <div><label className={lbl} htmlFor="cp">Old price (strikethrough)</label><input id="cp" type="number" min={0} step="0.01" className={inp} value={p.compare_at_price ?? ""} onChange={e => set("compare_at_price", e.target.value ? Number(e.target.value) : undefined)} /></div>
          <div><label className={lbl} htmlFor="st">Stock</label>{variants.length ? <p className="rounded-lg bg-cream-dark px-3 py-2 text-sm">{variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)} <span className="text-ink/50">(from variants)</span></p> : <input id="st" type="number" min={0} step="1" className={inp} value={p.stock} onChange={e => set("stock", Number(e.target.value))} />}</div>
          <div><label className={lbl} htmlFor="sk">SKU</label><input id="sk" className={inp} value={p.sku ?? ""} onChange={e => set("sku", e.target.value)} /></div>
        </div>
        <div className="mt-4"><span className={lbl}>Badges / sections on website</span><div className="flex flex-wrap gap-4">{TAGS.map(t => <label key={t} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-forest" checked={p.tags.includes(t)} onChange={e => set("tags", e.target.checked ? [...p.tags, t] : p.tags.filter(x => x !== t))} />{t === "best-seller" ? "Best seller" : t[0].toUpperCase() + t.slice(1)}</label>)}</div></div></section>

      <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Photos</h2><p className="mb-3 text-sm text-ink/60">First image is the main one. Without photos the site shows a branded placeholder bottle.</p>
        <ImageUploader value={p.images} onChange={v => set("images", v)} folder="products" /></section>

      <section className={card}><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-2xl font-semibold text-forest">Variants</h2><p className="text-sm text-ink/60">Optional: sizes or shades with their own price and stock.</p></div><button type="button" onClick={addVar} className={`${btn2} flex items-center gap-1`}><Plus size={16} />Add variant</button></div>
        {variants.map((v, i) => (<div key={v.id} className="mb-3 grid gap-2 rounded-lg border border-forest/10 p-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto]">
          <div><label className={lbl}>Label *</label><input className={inp} placeholder="15ml" value={v.label} onChange={e => setVar(i, { label: e.target.value, size: e.target.value })} /></div>
          <div><label className={lbl}>SKU</label><input className={inp} value={v.sku} onChange={e => setVar(i, { sku: e.target.value })} /></div>
          <div><label className={lbl}>Price</label><input type="number" min={0} step="0.01" className={inp} value={v.price} onChange={e => setVar(i, { price: Number(e.target.value) })} /></div>
          <div><label className={lbl}>Old price</label><input type="number" min={0} step="0.01" className={inp} value={v.compare_at_price ?? ""} onChange={e => setVar(i, { compare_at_price: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <div><label className={lbl}>Stock</label><input type="number" min={0} step="1" className={inp} value={v.stock} onChange={e => setVar(i, { stock: Number(e.target.value) })} /></div>
          <button type="button" aria-label="Remove variant" onClick={() => set("variants", variants.filter((_, k) => k !== i))} className="self-end p-2 text-red-700"><Trash2 size={18} /></button></div>))}
        {variants.length === 0 && <p className="text-sm text-ink/50">No variants. The product uses the single price and stock above.</p>}</section>

      <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">Product details</h2>
        <div className="grid gap-4">{TEXTS.map(([k, label]) => <div key={k}><label className={lbl} htmlFor={k}>{label}</label><textarea id={k} rows={k === "description" ? 4 : 2} className={inp} value={(p[k] as string) ?? ""} onChange={e => set(k, e.target.value as never)} /></div>)}
          <div className="grid gap-4 sm:grid-cols-2"><div><label className={lbl} htmlFor="sf">Suitable for</label><input id="sf" className={inp} value={p.suitable_for ?? ""} onChange={e => set("suitable_for", e.target.value)} /></div><div><label className={lbl} htmlFor="sz">Size</label><input id="sz" className={inp} value={p.size ?? ""} onChange={e => set("size", e.target.value)} /></div></div></div></section>

      <details className={card}><summary className="cursor-pointer font-semibold text-forest">Placeholder look (only used when there are no photos)</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-3"><div><label className={lbl}>Shape</label><select className={inp} value={p.visual.kind} onChange={e => set("visual", { ...p.visual, kind: e.target.value as Product["visual"]["kind"] })}>{KINDS.map(k => <option key={k}>{k}</option>)}</select></div>
          <div><label className={lbl}>Label on pack</label><input className={inp} value={p.visual.label} onChange={e => set("visual", { ...p.visual, label: e.target.value })} /></div>
          <div><label className={lbl}>Color</label><input type="color" className="h-10 w-full rounded-lg border border-forest/20" value={p.visual.color} onChange={e => set("visual", { ...p.visual, color: e.target.value })} /></div></div></details>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-forest/10 bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={p.is_active} onChange={e => set("is_active", e.target.checked)} />Visible on website</label>
        <button type="button" onClick={save} disabled={pending} className={btn}>{pending ? "Saving…" : isNew ? "Create product" : "Save changes"}</button>
        {!isNew && <button type="button" onClick={del} disabled={pending} className={btnDanger}>Delete</button>}
        {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}
      </div>
    </div>
  );
}

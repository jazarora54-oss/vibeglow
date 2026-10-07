"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { CATEGORY_OPTIONS } from "@/lib/shop";
import { autoSeo, slugify, type ProductInput } from "@/lib/data/mappers";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import { lbOzToG, shippingBadge, splitLbOz, weightText, DEFAULT_HANDLING_DAYS } from "@/lib/shipping/rules";
import ImageUploader from "./ImageUploader";
import { btn, btn2, btnDanger, card, inp, lbl } from "./ui";

export const emptyProduct = (): ProductInput => ({ id: "", slug: "", name: "", short_description: "", category: "skin-care", price: 0, images: [], visual: { kind: "bottle", label: "", color: "#E9D2B4" }, tags: [], stock: 0, is_active: true, sort_priority: 0, condition: "New", specifics: [] });
const TAGS: Product["tags"][number][] = ["new", "best-seller", "featured", "sale"];
const KINDS = ["bottle", "jar", "tube", "dropper", "pump"] as const;
const SPEC_IDEAS = ["Skin type", "Hair type", "Volume", "Formulation", "Key ingredient", "Scent", "Free from", "Certification", "Target age", "Package type"];
const TEXTS: [keyof ProductInput, string][] = [["description", "Description"], ["benefits", "Benefits"], ["ingredients", "Ingredients"], ["how_to_use", "How to use"], ["size_quantity", "Size / quantity note"], ["shipping_info", "Shipping info"], ["return_info", "Return info"]];

export default function ProductForm({ initial, isNew, defaultFlat = 5.99 }: { initial: ProductInput; isNew: boolean; defaultFlat?: number }) {
  const [p, setP] = useState<ProductInput>(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const [slugTouched, setSlugTouched] = useState(!isNew); const router = useRouter();
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP(x => ({ ...x, [k]: v }));
  const variants = p.variants ?? [];
  const w0 = splitLbOz(initial.weight_g); const [lb, setLb] = useState(w0.lb ? String(w0.lb) : ""); const [oz, setOz] = useState(w0.oz ? String(w0.oz) : "");
  const setWeight = (nl: string, no: string) => { setLb(nl); setOz(no); set("weight_g", Number(nl) > 0 || Number(no) > 0 ? lbOzToG(Number(nl), Number(no)) : undefined); };
  const mode = p.shipping_mode ?? "flat"; const badge = shippingBadge({ shipping_mode: mode, shipping_flat_price: p.shipping_flat_price, weight_g: p.weight_g }, { freeOver: 0, defaultFlat });
  const numOrU = (v: string) => (v === "" ? undefined : Number(v));
  const setVar = (i: number, patch: Partial<ProductVariant>) => set("variants", variants.map((v, k) => k === i ? { ...v, ...patch } : v));
  const addVar = () => set("variants", [...variants, { id: `v_${Date.now().toString(36)}`, sku: "", label: "", price: p.price || 0, stock: 0 }]);
  const specifics = p.specifics ?? [];
  const setSpec = (i: number, patch: Partial<{ name: string; value: string }>) => set("specifics", specifics.map((x, k) => k === i ? { ...x, ...patch } : x));
  const addSpec = (name = "") => set("specifics", [...specifics, { name, value: "" }]);
  const auto = autoSeo(p); const effT = (p.seo_title ?? "").trim() || auto.title, effD = (p.seo_description ?? "").trim() || auto.description;
  const fillSeo = () => setP(x => ({ ...x, seo_title: auto.title, seo_description: auto.description, seo_keywords: auto.keywords }));
  const checks: [boolean, string][] = [
    [p.name.trim().split(/\s+/).filter(Boolean).length >= 3, "Product name has 3 or more words (e.g. “Onion Hair Oil 100ml”)"],
    [effT.length >= 30 && effT.length <= 60, "Search title is 30 to 60 characters"],
    [effD.length >= 120 && effD.length <= 160, "Search description is 120 to 160 characters"],
    [p.images.length >= 3, "3 or more photos (buyers trust products with several photos)"],
    [(p.description ?? "").trim().length >= 150, "Description is 150+ characters"],
    [specifics.filter(x => x.name.trim() && x.value.trim()).length >= 3, "3 or more item specifics (like eBay)"],
    [Boolean(p.brand?.trim()), "Brand is filled in"],
    [Boolean(p.gtin?.trim()), "Barcode (GTIN/UPC) added. Needed for Google Shopping"],
  ];
  const score = Math.round((checks.filter(c => c[0]).length / checks.length) * 100);
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

      <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Shipping</h2><p className="mb-4 text-sm text-ink/60">Choose how shipping works for this listing, like on eBay. Customers see it on the product page and at checkout.</p>
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Shipping type">
          {([["free", "Free shipping", "You pay the shipping. Customers see a “Free shipping” badge."], ["flat", "Flat rate", "Customer pays a fixed amount that you set."], ["calculated", "Calculated", "Real USPS / UPS / FedEx price from the weight and box size."]] as const).map(([m, t, d]) =>
            <label key={m} className={`cursor-pointer rounded-xl border-2 p-4 text-sm ${mode === m ? "border-forest bg-forest-100" : "border-forest/15 hover:border-forest/40"}`}><span className="flex items-center gap-2 font-semibold text-forest"><input type="radio" name="shipmode" className="h-4 w-4 accent-forest" checked={mode === m} onChange={() => set("shipping_mode", m)} />{t}</span><span className="mt-1 block text-xs text-ink/60">{d}</span></label>)}</div>
        {mode === "flat" && <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className={lbl} htmlFor="sfp">Shipping price, first item (USD)</label><input id="sfp" type="number" min={0} step="0.01" className={inp} value={p.shipping_flat_price ?? ""} placeholder={`${defaultFlat.toFixed(2)} (store default)`} onChange={e => set("shipping_flat_price", numOrU(e.target.value))} /><p className="mt-1 text-xs text-ink/50">Leave empty to use the store default. Type 0 for free.</p></div>
          <div><label className={lbl} htmlFor="sep">Each additional item (USD)</label><input id="sep" type="number" min={0} step="0.01" className={inp} value={p.shipping_extra_price ?? ""} placeholder="0.00" onChange={e => set("shipping_extra_price", numOrU(e.target.value))} /><p className="mt-1 text-xs text-ink/50">When a customer buys several. Empty = no extra charge.</p></div></div>}
        {mode === "free" && <p className="mt-4 rounded-lg bg-cream p-3 text-sm text-ink/70">Free shipping means <b>you</b> pay the carrier. Tip: add part of the shipping cost into the product price.</p>}
        {mode === "calculated" && <p className="mt-4 rounded-lg bg-cream p-3 text-sm text-ink/70">The customer pays the real carrier price for their address. <b>Weight is required.</b> Add the box size below for accurate prices.</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2"><span className={lbl}>Package weight {mode === "calculated" ? "*" : ""}</span><div className="flex items-center gap-2"><input aria-label="Pounds" type="number" min={0} step="1" className={inp} value={lb} placeholder="0" onChange={e => setWeight(e.target.value, oz)} /><span className="text-sm">lb</span><input aria-label="Ounces" type="number" min={0} step="0.1" className={inp} value={oz} placeholder="0" onChange={e => setWeight(lb, e.target.value)} /><span className="text-sm">oz</span></div>{p.weight_g ? <p className="mt-1 text-xs text-ink/50">= {weightText(p.weight_g)} ({Math.round(p.weight_g)} g)</p> : <p className="mt-1 text-xs text-ink/50">One item, packed, without the shipping box.</p>}</div>
          <div className="sm:col-span-2"><span className={lbl}>Package size, inches (L × W × H)</span><div className="flex items-center gap-2">{(["pkg_length_in", "pkg_width_in", "pkg_height_in"] as const).map((k, i) => <span key={k} className="flex flex-1 items-center gap-2">{i > 0 && <span className="text-ink/40">×</span>}<input aria-label={["Length", "Width", "Height"][i]} type="number" min={0} step="0.1" className={inp} value={p[k] ?? ""} placeholder={["L", "W", "H"][i]} onChange={e => set(k, numOrU(e.target.value))} /></span>)}</div></div>
          <div className="sm:col-span-2"><label className={lbl} htmlFor="hd">Handling time</label><select id="hd" className={inp} value={p.handling_days ?? ""} onChange={e => set("handling_days", e.target.value === "" ? undefined : Number(e.target.value))}><option value="">Store default ({DEFAULT_HANDLING_DAYS} business days)</option><option value={0}>Same day</option><option value={1}>1 business day</option><option value={2}>2 business days</option><option value={3}>3 business days</option><option value={5}>5 business days</option><option value={7}>7 business days</option><option value={10}>10 business days</option></select><p className="mt-1 text-xs text-ink/50">How long you need to pack it and hand it to the carrier.</p></div></div>
        <p className="mt-4 text-sm">Customers will see: <span className={`ml-1 rounded-md px-2.5 py-1 text-xs font-semibold ${badge.kind === "free" ? "bg-forest text-white" : "bg-cream-dark text-forest"}`}>{badge.text}</span></p></section>

      <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">Product details</h2>
        <div className="grid gap-4">{TEXTS.map(([k, label]) => <div key={k}><label className={lbl} htmlFor={k}>{label}</label><textarea id={k} rows={k === "description" ? 4 : 2} className={inp} value={(p[k] as string) ?? ""} onChange={e => set(k, e.target.value as never)} /></div>)}
          <div className="grid gap-4 sm:grid-cols-2"><div><label className={lbl} htmlFor="sf">Suitable for</label><input id="sf" className={inp} value={p.suitable_for ?? ""} onChange={e => set("suitable_for", e.target.value)} /></div><div><label className={lbl} htmlFor="sz">Size</label><input id="sz" className={inp} value={p.size ?? ""} onChange={e => set("size", e.target.value)} /></div></div></div></section>

      <section className={card}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold text-forest">Item specifics &amp; identifiers</h2><p className="text-sm text-ink/60">Like eBay: the more details, the more buyers (and Google) trust the listing. Shown in the “Specifications” tab.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={lbl} htmlFor="cond">Condition</label><select id="cond" className={inp} value={p.condition ?? "New"} onChange={e => set("condition", e.target.value)}><option>New</option><option>New – open box</option></select></div>
          <div><label className={lbl} htmlFor="gtin">Barcode (GTIN / UPC / EAN)</label><input id="gtin" className={inp} value={p.gtin ?? ""} onChange={e => set("gtin", e.target.value)} /></div>
          <div><label className={lbl} htmlFor="mpn">MPN (manufacturer part no.)</label><input id="mpn" className={inp} value={p.mpn ?? ""} onChange={e => set("mpn", e.target.value)} /></div>
          <div><label className={lbl} htmlFor="coo">Country of origin</label><input id="coo" className={inp} value={p.country_of_origin ?? ""} onChange={e => set("country_of_origin", e.target.value)} /></div>
          <div><label className={lbl} htmlFor="shelf">Shelf life / expiry</label><input id="shelf" className={inp} value={p.shelf_life ?? ""} onChange={e => set("shelf_life", e.target.value)} placeholder="24 months" /></div>
          <div className="sm:col-span-3"><label className={lbl} htmlFor="dim">Dimensions</label><input id="dim" className={inp} value={p.dimensions ?? ""} onChange={e => set("dimensions", e.target.value)} placeholder="12 × 5 × 5 cm (auto-filled from the package size)" /></div></div>
        <div className="mt-5"><span className={lbl}>Custom item specifics</span>
          {specifics.map((x, i) => <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><input aria-label="Specific name" className={inp} placeholder="Name (e.g. Skin type)" value={x.name} onChange={e => setSpec(i, { name: e.target.value })} /><input aria-label="Specific value" className={inp} placeholder="Value (e.g. All skin types)" value={x.value} onChange={e => setSpec(i, { value: e.target.value })} /><button type="button" aria-label="Remove" onClick={() => set("specifics", specifics.filter((_, k) => k !== i))} className="p-2 text-red-700"><Trash2 size={18} /></button></div>)}
          <div className="mt-2 flex flex-wrap items-center gap-2"><button type="button" onClick={() => addSpec()} className={`${btn2} flex items-center gap-1`}><Plus size={16} />Add specific</button>
            <span className="text-xs text-ink/50">Quick add:</span>{SPEC_IDEAS.filter(n => !specifics.some(x => x.name === n)).map(n => <button key={n} type="button" onClick={() => addSpec(n)} className="rounded-full border border-forest/20 bg-white px-3 py-1 text-xs text-forest hover:bg-forest-100">{n}</button>)}</div></div></section>

      <section className={card}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold text-forest">Google search (SEO) &amp; ranking</h2><p className="text-sm text-ink/60">Leave search fields empty and they are written for you automatically when you save.</p></div><button type="button" onClick={fillSeo} className={btn2}>Auto-fill search text</button></div>
        <div className="rounded-xl border border-forest/10 bg-cream p-4"><p className="truncate text-lg text-blue-700">{effT}</p><p className="truncate text-xs text-green-700">your-website › product › {slugify(p.slug || p.name) || "…"}</p><p className="mt-1 text-sm text-ink/70">{effD}</p></div>
        <div className="mt-4 grid gap-4">
          <div><label className={lbl} htmlFor="st">Search title <span className="font-normal normal-case">({(p.seo_title ?? "").length}/60)</span></label><input id="st" className={inp} maxLength={90} value={p.seo_title ?? ""} onChange={e => set("seo_title", e.target.value)} placeholder={auto.title} /></div>
          <div><label className={lbl} htmlFor="sdsc">Search description <span className="font-normal normal-case">({(p.seo_description ?? "").length}/160)</span></label><textarea id="sdsc" rows={2} maxLength={300} className={inp} value={p.seo_description ?? ""} onChange={e => set("seo_description", e.target.value)} placeholder={auto.description} /></div>
          <div><label className={lbl} htmlFor="skw">Keywords (separate with commas)</label><input id="skw" className={inp} value={p.seo_keywords ?? ""} onChange={e => set("seo_keywords", e.target.value)} placeholder={auto.keywords} /></div></div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div><div className="mb-2 flex items-center gap-3"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-forest/10"><div className={`h-full ${score >= 75 ? "bg-green-600" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} /></div><b className="text-forest">{score}%</b></div>
            <ul className="space-y-1 text-sm">{checks.map(([ok, t]) => <li key={t} className={ok ? "text-green-700" : "text-ink/60"}>{ok ? "✓" : "○"} {t}</li>)}</ul></div>
          <div><label className={lbl} htmlFor="rank">Show higher in the shop</label><select id="rank" className={inp} value={p.sort_priority ?? 0} onChange={e => set("sort_priority", Number(e.target.value))}><option value={0}>Normal (newest first)</option><option value={10}>Boosted (above normal products)</option><option value={100}>Top (first on shop &amp; homepage lists)</option></select>
            <p className="mt-2 text-xs text-ink/50">Use “Top” for the products you want to sell fastest. You can also tick the “Best seller”, “New” or “Sale” badges above so it appears in those homepage sections.</p></div></div></section>

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

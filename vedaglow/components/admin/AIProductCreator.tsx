"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { createAiProduct, generateProductDraft } from "@/app/admin/actions";
import { scanClaims, SENSITIVE } from "@/lib/ai/draft";
import type { AiDraft } from "@/lib/ai/draft";
import { btn, btn2, card, inp, lbl } from "./ui";
import PriceCheck from "./PriceCheck";
const OK = ["image/jpeg", "image/png", "image/webp"];
const LABEL: Record<string, string> = { ingredients: "Ingredients", how_to_use: "How to use", benefits: "Benefits", size_quantity: "Size / quantity", suitable_for: "Suitable for" };
const empty = (cat: string): AiDraft => ({ name: "", brand: "", product_type: "", category: cat, short_description: "", description: "", ingredients: "", how_to_use: "", benefits: "", size_quantity: "", suitable_for: "", seo_title: "", seo_description: "", seo_keywords: "" });
/** Shrinks a photo and saves it as WebP (browser side, nothing is uploaded yet). */
async function toWebp(file: File, max: number, q: number): Promise<Blob> {
  const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("Could not convert the photo."))), "image/webp", q));
}
const b64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = () => rej(new Error("read")); r.readAsDataURL(b); });

export default function AIProductCreator({ categories, aiReady, status, used, limit }: { categories: { slug: string; name: string }[]; aiReady: boolean; status: string; used: number; limit: number }) {
  const [file, setFile] = useState<File | null>(null), [price, setPrice] = useState(""), [notes, setNotes] = useState(""), [urls, setUrls] = useState(""), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [done, setDone] = useState("");
  const [d, setD] = useState<AiDraft | null>(null), [needs, setNeeds] = useState<string[]>([]), [warn, setWarn] = useState<string[]>([]), [ack, setAck] = useState(false), [left, setLeft] = useState(Math.max(0, limit - used));
  const [prev, setPrev] = useState(""); const full = useRef<Blob | null>(null), thumb = useRef<Blob | null>(null);
  useEffect(() => { if (!file) { setPrev(""); return; } const u = URL.createObjectURL(file); setPrev(u); return () => URL.revokeObjectURL(u); }, [file]);
  const cat0 = categories[0]?.slug ?? "skin-care";
  const pick = (f: File | null) => { setErr(""); setDone(""); setD(null); if (!f) { setFile(null); return; } if (!OK.includes(f.type)) { setErr("Only JPG, PNG or WebP photos are allowed."); return; } if (f.size > 10 * 1024 * 1024) { setErr("The photo is over 10 MB. Use a smaller one."); return; } setFile(f); };
  const prepare = async () => { if (!file) throw new Error("Choose a photo first."); full.current = await toWebp(file, 1600, 0.85); thumb.current = await toWebp(file, 400, 0.8); return toWebp(file, 1024, 0.8); };
  const priceN = Number(price); const priceOk = priceN > 0 && priceN <= 100000;
  const run = async (manual: boolean) => {
    setErr(""); setDone(""); if (!file) { setErr("Choose ONE product photo first."); return; } if (!priceOk) { setErr("Enter the selling price (USD)."); return; }
    try {
      setBusy(manual ? "Preparing photo…" : "Preparing photo…"); const small = await prepare();
      if (manual) { setD(empty(cat0)); setNeeds([...SENSITIVE]); setWarn([]); setAck(false); return; }
      setBusy("AI is reading the photo… (up to 30 seconds)");
      const r = await generateProductDraft({ image_base64: await b64(small), mime: "image/webp", price: priceN, notes, urls, category_options: categories.map(c => c.slug) });
      if (typeof r.left === "number") setLeft(r.left);
      if (!r.ok || !r.draft) { setErr(r.message ?? "The AI could not answer."); return; }
      setD(r.draft); setNeeds(r.needs ?? []); setWarn(r.warnings ?? []); setAck(false);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(""); }
  };
  const set = <K extends keyof AiDraft>(k: K, v: AiDraft[K]) => setD(x => (x ? { ...x, [k]: v } : x));
  const empties = useMemo(() => (d ? SENSITIVE.filter(f => !d[f].trim()) : []), [d]);
  const claims = useMemo(() => (d ? scanClaims([d.name, d.short_description, d.description, d.benefits, d.seo_title, d.seo_description].join(" \n ")) : []), [d]);
  const needsAck = empties.length > 0 || claims.length > 0;
  const save = async (publish: boolean) => {
    if (!d || !full.current || !thumb.current) return; setErr(""); setDone("");
    if (publish && needsAck && !ack) { setErr("Tick the confirmation box first."); return; }
    if (publish && !confirm("Publish this product on the shop now? Customers will see it.")) return;
    try {
      setBusy("Saving…"); const sb = browserClient(); const id = `ai/${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const up = async (b: Blob, p: string) => { const { error } = await sb.storage.from("media").upload(p, b, { cacheControl: "31536000", upsert: false, contentType: "image/webp" }); if (error) throw new Error(`Upload failed: ${error.message}`); return sb.storage.from("media").getPublicUrl(p).data.publicUrl; };
      const main = await up(full.current, `${id}.webp`); const th = await up(thumb.current, `${id}-thumb.webp`);
      const r = await createAiProduct({ draft: d, price: priceN, images: [main], thumb: th, publish, acknowledged: ack, notes, urls, needs });
      if (!r.ok) { setErr(r.message ?? "Could not save."); return; } setDone(r.message ?? "Saved."); setD(null); setFile(null); setPrice(""); setNotes(""); setUrls("");
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(""); }
  };
  const T = (id: string, label: string, k: keyof AiDraft, o?: { rows?: number; max?: number }) => <div key={k}><label className={lbl} htmlFor={id}>{label}</label>{o?.rows ? <textarea id={id} rows={o.rows} maxLength={o.max} className={inp} value={d![k]} onChange={e => set(k, e.target.value)} /> : <input id={id} maxLength={o?.max} className={inp} value={d![k]} onChange={e => set(k, e.target.value)} />}</div>;
  return (<div className="space-y-5">
    <section className={card}><p className={`mb-3 rounded-lg p-3 text-sm ${aiReady ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900"}`}>{aiReady ? `AI is connected. ${left} of ${limit} AI drafts left today.` : status} {!aiReady && "You can still use “Fill by hand”."}</p>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className={lbl} htmlFor="ph">1. Product photo (one)</label><input id="ph" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => pick(e.target.files?.[0] ?? null)} className="block w-full text-sm" />{prev && <img src={prev} alt="Selected product" className="mt-3 h-40 rounded-lg border border-forest/15 object-contain" />}</div>
        <div><label className={lbl} htmlFor="pr">2. Selling price (USD)</label><input id="pr" inputMode="decimal" className={inp} value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="24.99" /><p className="mt-1 text-xs text-ink/50">You set the price. The AI never does.</p></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="nt">Notes for the AI (optional but best): product name, size, ingredients exactly as printed, how to use</label><textarea id="nt" rows={3} maxLength={1200} className={inp} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="ur">Reference links (optional, kept in your records; the AI cannot open them)</label><input id="ur" className={inp} value={urls} onChange={e => setUrls(e.target.value)} placeholder="https://supplier.example/product" /></div></div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button className={btn} disabled={!!busy || !aiReady || left <= 0} onClick={() => run(false)}>Create draft with AI</button><button className={btn2} disabled={!!busy} onClick={() => run(true)}>Fill by hand</button>{busy && <span role="status" className="text-sm text-ink/70">{busy}</span>}</div>
      {err && <p role="alert" className="mt-3 text-sm font-medium text-red-700">⚠ {err}</p>}{done && <p role="status" className="mt-3 text-sm font-medium text-green-800">✓ {done}</p>}</section>
    {d && <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">3. Preview &amp; check</h2><p className="mb-4 text-sm text-ink/60">Nothing is public yet. Edit anything, then save as a draft or publish.</p>
      <div className="mb-5 flex gap-4 rounded-xl border border-forest/10 bg-cream p-3">{prev && <img src={prev} alt="" className="h-24 w-24 rounded object-contain" />}<div><p className="font-semibold text-forest">{d.name || "(no name yet)"}</p><p className="text-sm text-ink/70">{d.short_description}</p><p className="mt-1 font-semibold">${priceOk ? priceN.toFixed(2) : "—"}</p></div></div>
      {warn.length > 0 && <ul className="mb-4 list-disc space-y-1 rounded-lg bg-amber-50 p-3 pl-7 text-sm text-amber-900">{warn.map(w => <li key={w}>{w}</li>)}</ul>}
      {claims.length > 0 && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">Risky wording now in the text: {claims.join(", ")}. Remove it unless you can prove it.</p>}
      <div className="grid gap-4 sm:grid-cols-2">{T("n", "Name", "name", { max: 120 })}{T("b", "Brand", "brand", { max: 80 })}{T("pt", "Product type", "product_type", { max: 80 })}
        <div><label className={lbl} htmlFor="cat">Category</label><select id="cat" className={inp} value={d.category} onChange={e => set("category", e.target.value)}>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div></div>
      <div className="mt-4 space-y-4">{T("sd", "Short description", "short_description", { rows: 2, max: 200 })}{T("ds", "Description", "description", { rows: 5, max: 1500 })}</div>
      <h3 className="mb-2 mt-6 font-display text-xl font-semibold text-forest">Facts to verify</h3><p className="mb-3 text-xs text-ink/60">Only copy these from the real label or your supplier. The AI is not allowed to guess them.</p>
      <div className="space-y-4">{SENSITIVE.map(f => <div key={f}><div className="mb-1 flex items-center gap-2"><label className={`${lbl} !mb-0`} htmlFor={f}>{LABEL[f]}</label>{!d[f].trim() ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Needs Verification</span> : needs.includes(f) ? null : <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">From label / your notes</span>}</div><textarea id={f} rows={f === "ingredients" || f === "how_to_use" ? 3 : 2} className={inp} value={d[f]} onChange={e => set(f, e.target.value)} /></div>)}</div>
      <h3 className="mb-2 mt-6 font-display text-xl font-semibold text-forest">Search (SEO)</h3><div className="space-y-4">{T("st", "SEO title (max 60)", "seo_title", { max: 70 })}{T("sdd", "SEO description (max 155)", "seo_description", { rows: 2, max: 160 })}{T("sk", "Keywords", "seo_keywords", { max: 200 })}</div>
      <div className="mt-6"><PriceCheck name={d.name} brand={d.brand} size={d.size_quantity} price={priceN} /></div>
      {needsAck && <label className="mt-6 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-forest" checked={ack} onChange={e => setAck(e.target.checked)} /><span>I checked this listing. Empty “Needs Verification” fields are fine to leave empty, and I can back up every claim in the text.</span></label>}
      <div className="mt-5 flex flex-wrap items-center gap-3"><button className={btn2} disabled={!!busy} onClick={() => save(false)}>Save as draft (hidden)</button><button className={btn} disabled={!!busy || (needsAck && !ack)} onClick={() => save(true)}>Publish to shop</button><button className="text-sm text-ink/60 underline" onClick={() => { setD(null); }}>Discard</button></div></section>}
  </div>);
}

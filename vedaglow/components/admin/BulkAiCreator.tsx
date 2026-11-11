"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { checkDuplicates, createAiProduct, generateProductDraft } from "@/app/admin/actions";
import { SENSITIVE, type AiDraft } from "@/lib/ai/draft";
import { b64, dHash, makeGraphics, toWebp } from "./aiClient";
import { btn, btn2, card, inp, lbl } from "./ui";
const OK = ["image/jpeg", "image/png", "image/webp"]; const MAX_ROWS = 10;
type Row = { id: number; front: File | null; back: File | null; ing: File | null; name: string; price: string; qty: string; size: string; note: string; status: string; state: "idle" | "work" | "ok" | "skip" | "fail" };
const blank = (id: number): Row => ({ id, front: null, back: null, ing: null, name: "", price: "", qty: "", size: "", note: "", status: "", state: "idle" });
const empty = (cat: string, name: string, size: string): AiDraft => ({ name, brand: "", product_type: "", category: cat, short_description: "", description: "", ingredients: "", how_to_use: "", benefits: "", size_quantity: size, suitable_for: "", seo_title: "", seo_description: "", seo_keywords: "", faqs: [], image_alt: name, specifics: [], condition: "New", country_of_origin: "", mpn: "", gtin: "", shelf_life: "" });
const pickFile = (f?: File | null) => (f && OK.includes(f.type) && f.size <= 10 * 1024 * 1024 ? f : null);

/** List many products in one go: for each row add photos, price, quantity and size. Rows are listed one by one. */
export default function BulkAiCreator({ categories, aiReady, left: left0, autoPublish }: { categories: { slug: string; name: string }[]; aiReady: boolean; left: number; autoPublish: boolean }) {
  const [rows, setRows] = useState<Row[]>([blank(1)]), [manual, setManual] = useState(!aiReady), [running, setRunning] = useState(false), [left, setLeft] = useState(left0), [next, setNext] = useState(2), [log, setLog] = useState("");
  const cat0 = categories[0]?.slug ?? "skin-care";
  const upd = (id: number, p: Partial<Row>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p } : r)));
  const check = (r: Row) => !r.front ? "front photo missing" : !(Number(r.price) > 0 && Number(r.price) <= 100000) ? "price missing" : !/^\d{1,6}$/.test(r.qty.trim()) ? "quantity missing (use 0 if none)" : manual && !r.name.trim() ? "name missing (needed without AI)" : "";
  const one = async (r: Row, stopFlag: { stop: boolean }) => {
    const bad = check(r); if (bad) { upd(r.id, { state: "fail", status: `Skipped: ${bad}` }); return; }
    try {
      upd(r.id, { state: "work", status: "Preparing photos…" }); const hash = await dHash(r.front!); const full = await toWebp(r.front!, 1600, 0.85), thumb = await toWebp(r.front!, 400, 0.8), small = await toWebp(r.front!, 1024, 0.8);
      let draft: AiDraft, needs: string[] = [...SENSITIVE];
      if (manual) draft = empty(cat0, r.name.trim().slice(0, 120), r.size.trim());
      else {
        upd(r.id, { status: "AI is reading the photos…" }); const extra: { kind: "back" | "ingredients"; image_base64: string }[] = [];
        if (r.back) extra.push({ kind: "back", image_base64: await b64(await toWebp(r.back, 1024, 0.8)) }); if (r.ing) extra.push({ kind: "ingredients", image_base64: await b64(await toWebp(r.ing, 1024, 0.8)) });
        const notes = [r.name.trim() && `Product name: ${r.name.trim()}`, r.size.trim() && `Size: ${r.size.trim()}`, r.note.trim()].filter(Boolean).join("\n");
        const a = await generateProductDraft({ image_base64: await b64(small), mime: "image/webp", extra_images: extra, price: Number(r.price), notes, urls: "", category_options: categories.map(c => c.slug) });
        if (typeof a.left === "number") { setLeft(a.left); if (a.left <= 0) stopFlag.stop = true; }
        if (!a.ok || !a.draft) { upd(r.id, { state: "fail", status: a.message ?? "The AI could not answer." }); return; }
        draft = a.draft; needs = a.needs ?? []; if (r.size.trim()) { draft.size_quantity = r.size.trim(); needs = needs.filter(n => n !== "size_quantity"); }
      }
      const dup = (await checkDuplicates(draft.name, hash)).hits ?? []; if (dup.length) { upd(r.id, { state: "skip", status: `Not listed: looks like "${dup[0].name}" (${dup[0].why}).` }); return; }
      upd(r.id, { status: "Uploading pictures…" }); const sb = browserClient(); const id = `ai/${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const up = async (b: Blob, p: string) => { const { error } = await sb.storage.from("media").upload(p, b, { cacheControl: "31536000", upsert: false, contentType: "image/webp" }); if (error) throw new Error(`Upload failed: ${error.message}`); return sb.storage.from("media").getPublicUrl(p).data.publicUrl; };
      const urls = [await up(full, `${id}.webp`)]; const th = await up(thumb, `${id}-thumb.webp`);
      if (r.back) urls.push(await up(await toWebp(r.back, 1600, 0.85), `${id}-back.webp`)); if (r.ing) urls.push(await up(await toWebp(r.ing, 1600, 0.85), `${id}-ingredients.webp`));
      const gfx = await makeGraphics(r.front!, draft); for (let i = 0; i < gfx.length; i++) urls.push(await up(gfx[i], `${id}-extra${i + 1}.webp`));
      upd(r.id, { status: "Saving…" }); const res = await createAiProduct({ draft, price: Number(r.price), stock: Number(r.qty), images: urls, thumb: th, publish: false, acknowledged: false, notes: r.note, urls: "", needs, imageHash: hash, auto: !manual });
      upd(r.id, res.ok ? { state: "ok", status: res.message ?? "Saved." } : { state: "fail", status: res.message ?? "Could not save." });
    } catch (e) { upd(r.id, { state: "fail", status: e instanceof Error ? e.message : "Something went wrong." }); }
  };
  const start = async () => {
    if (running) return; const todo = rows.filter(r => r.state !== "ok" && r.state !== "skip"); if (!todo.length) return; if (!manual && !aiReady) { setLog("AI is not connected. Tick “Without AI” or connect a key."); return; }
    setRunning(true); setLog(""); const flag = { stop: false };
    for (const r of todo) { if (flag.stop) { upd(r.id, { state: "fail", status: "Not started: the daily AI limit is used up." }); continue; } await one(r, flag); }
    setRunning(false); setLog("Finished. Open Products to check the new items.");
  };
  const done = rows.filter(r => r.state === "ok").length;
  return (<section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">List many products at once</h2>
    <p className="mb-3 text-sm text-ink/70">For each product add the photos, price, quantity and size. The studio lists them one by one: AI writes the text (or you type the name if you tick “Without AI”), adds the pictures and quantity. {autoPublish ? "Auto Publish is ON: products that pass every check go live." : "Auto Publish is OFF: everything is saved as a hidden draft for you to check."} Items that look like duplicates are skipped.</p>
    <label className="mb-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={manual} disabled={running} onChange={e => setManual(e.target.checked)} />Without AI (I type the name; photos, price, quantity and size are saved as a hidden draft)</label>
    <div className="space-y-4">{rows.map((r, i) => <div key={r.id} className="rounded-xl border border-forest/15 p-3"><div className="mb-2 flex items-center justify-between"><b className="text-forest">Product {i + 1}</b>{rows.length > 1 && !running && <button className="text-xs text-red-700 underline" onClick={() => setRows(rs => rs.filter(x => x.id !== r.id))}>Remove</button>}</div>
      <div className="grid gap-3 sm:grid-cols-3"><div><label className={lbl}>Front photo *</label><input type="file" accept="image/jpeg,image/png,image/webp" disabled={running || r.state === "ok"} className="block w-full text-xs" onChange={e => upd(r.id, { front: pickFile(e.target.files?.[0]), state: "idle", status: "" })} /></div>
        <div><label className={lbl}>Back (optional)</label><input type="file" accept="image/jpeg,image/png,image/webp" disabled={running || r.state === "ok"} className="block w-full text-xs" onChange={e => upd(r.id, { back: pickFile(e.target.files?.[0]) })} /></div>
        <div><label className={lbl}>Ingredients (optional)</label><input type="file" accept="image/jpeg,image/png,image/webp" disabled={running || r.state === "ok"} className="block w-full text-xs" onChange={e => upd(r.id, { ing: pickFile(e.target.files?.[0]) })} /></div>
        <div><label className={lbl}>Price (USD) *</label><input inputMode="decimal" className={inp} value={r.price} disabled={running} onChange={e => upd(r.id, { price: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="24.99" /></div>
        <div><label className={lbl}>Quantity in stock *</label><input inputMode="numeric" className={inp} value={r.qty} disabled={running} onChange={e => upd(r.id, { qty: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="25" /></div>
        <div><label className={lbl}>Size (e.g. 40g, 100 ml)</label><input className={inp} maxLength={40} value={r.size} disabled={running} onChange={e => upd(r.id, { size: e.target.value })} /></div>
        <div className="sm:col-span-3"><label className={lbl}>Name {manual ? "*" : "(optional, helps the AI)"} and any note for the AI</label><div className="grid gap-2 sm:grid-cols-2"><input className={inp} maxLength={120} value={r.name} disabled={running} onChange={e => upd(r.id, { name: e.target.value })} placeholder="Product name" /><input className={inp} maxLength={300} value={r.note} disabled={running} onChange={e => upd(r.id, { note: e.target.value })} placeholder="Ingredients, how to use… exactly as printed" /></div></div></div>
      {r.status && <p role="status" className={`mt-2 text-sm font-medium ${r.state === "ok" ? "text-green-800" : r.state === "work" ? "text-ink/70" : "text-red-700"}`}>{r.state === "ok" ? "✓ " : r.state === "work" ? "… " : "⚠ "}{r.status}</p>}</div>)}</div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button className={btn} disabled={running} onClick={start}>{running ? "Listing…" : `List ${rows.filter(r => r.state !== "ok" && r.state !== "skip").length || ""} product(s) one by one`}</button><button className={btn2} disabled={running || rows.length >= MAX_ROWS} onClick={() => { setRows(rs => [...rs, blank(next)]); setNext(n => n + 1); }}>+ Add another product</button><span className="text-xs text-ink/60">Up to {MAX_ROWS} per round. {!manual && `AI left today: ${left}.`} Done: {done}.</span></div>
    {log && <p className="mt-3 text-sm font-medium text-green-800">{log}</p>}</section>);
}

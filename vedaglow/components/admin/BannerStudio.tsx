"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { browserClient } from "@/lib/supabase/browser";
import { saveBanner, saveBannerSettings } from "@/app/admin/actions";
import { BANNER_SIZES, loadBitmap, renderWebp, drawCreative, type Template } from "@/lib/creative/render";
import { btn, btn2, card, inp, lbl } from "./ui";
const TEMPLATES: [Template, string][] = [["auto", "Auto (best for the shape)"], ["left-panel", "Text on the left"], ["split", "Text panel + photo"], ["center", "Centered text"], ["bottom-bar", "Text at the bottom"], ["photo-only", "Photo only (no text)"]];
const FOCUS: [string, number, number][] = [["Center", 0.5, 0.5], ["Left", 0.2, 0.5], ["Right", 0.8, 0.5], ["Top", 0.5, 0.2], ["Bottom", 0.5, 0.8]];
type P = { id: string; name: string; slug: string; image: string; price: number };
/** Pick any photo -> the studio designs the homepage banners (desktop + phone) as WebP and saves them. Your original photo is kept untouched. */
export default function BannerStudio({ autoUpload, nextOrder, products }: { autoUpload: boolean; nextOrder: number; products: P[] }) {
  const [file, setFile] = useState<File | null>(null), [bmp, setBmp] = useState<ImageBitmap | null>(null), [auto, setAuto] = useState(autoUpload), [msg, setMsg] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState("");
  const [head, setHead] = useState(""), [sub, setSub] = useState(""), [cta, setCta] = useState("SHOP NOW"), [link, setLink] = useState("/shop"), [alt, setAlt] = useState(""), [tpl, setTpl] = useState<Template>("auto"), [focus, setFocus] = useState(0), [from, setFrom] = useState(""), [prodSel, setProdSel] = useState(""), [until, setUntil] = useState(""), [order, setOrder] = useState(nextOrder);
  const dRef = useRef<HTMLCanvasElement>(null), mRef = useRef<HTMLCanvasElement>(null);
  const opts = () => ({ template: tpl, focusX: FOCUS[focus][1], focusY: FOCUS[focus][2], copy: { headline: head, sub, cta } });
  useEffect(() => { // live preview (small canvases; the real files are made at full size on save)
    if (!bmp) return; for (const [ref, spec] of [[dRef, BANNER_SIZES.desktop], [mRef, BANNER_SIZES.mobile]] as const) { const cv = ref.current; if (!cv) continue; cv.width = spec.w; cv.height = spec.h; const c = cv.getContext("2d"); if (c) drawCreative(c, bmp, spec.w, spec.h, opts()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmp, head, sub, cta, tpl, focus]);
  const setSource = async (src: Blob | string, f: File | null, name?: string) => { setErr(""); setMsg(""); try { const b = await loadBitmap(src); setBmp(b); setFile(f); if (name) { setHead(h => h || name); setAlt(a => a || name); } } catch (e) { setErr(e instanceof Error ? e.message : "Could not open that picture."); } };
  const pick = (f: File | null) => { if (!f) return; if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setErr("Use a JPG, PNG or WebP photo."); return; } if (f.size > 12 * 1024 * 1024) { setErr("The photo is over 12 MB. Use a smaller one."); return; } setProdSel(""); void setSource(f, f); };
  const fromProduct = (id: string) => { const p = products.find(x => x.id === id); if (!p || !p.image) return; setLink(`/product/${p.slug}`); setCta("SHOP NOW"); void setSource(p.image, null, p.name); };
  const save = async () => {
    if (!bmp) { setErr("Choose a photo (or a product) first."); return; } setErr(""); setMsg("");
    try {
      setBusy("Designing the banners…"); const o = opts(); const [d, m] = await Promise.all([renderWebp(bmp, BANNER_SIZES.desktop, o), renderWebp(bmp, BANNER_SIZES.mobile, o, 350)]);
      setBusy("Uploading…"); const sb = browserClient(); const id = `banners/studio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const up = async (b: Blob | File, path: string, type: string) => { const { error } = await sb.storage.from("media").upload(path, b, { cacheControl: "31536000", upsert: false, contentType: type }); if (error) throw new Error(`Upload failed: ${error.message}`); return sb.storage.from("media").getPublicUrl(path).data.publicUrl; };
      if (file) await up(file, `banners/originals/${id.split("/")[1]}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`, file.type); // the original stays untouched
      const url = await up(d, `${id}-desktop.webp`, "image/webp"), murl = await up(m, `${id}-mobile.webp`, "image/webp");
      const r = await saveBanner({ title: "", subtitle: "", button_text: "", button_link: link || "/shop", image_url: url, mobile_image_url: murl, image_alt: alt || head, sort_order: order, is_active: auto, starts_at: from || null, ends_at: until || null });
      if (!r.ok) { setErr(r.message ?? "Could not save the banner."); return; }
      setMsg(auto ? "Saved and LIVE on the homepage ✓" : "Saved as hidden ✓ Open Homepage banners and switch it on when you are happy."); setBmp(null); setFile(null); setHead(""); setSub(""); setAlt(""); setOrder(o => o + 1);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(""); }
  };
  const download = async (key: string) => { if (!bmp) return; const b = await renderWebp(bmp, BANNER_SIZES[key], opts(), 600); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `vedaglow-banner-${BANNER_SIZES[key].w}x${BANNER_SIZES[key].h}.webp`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  return (<div className="space-y-5">
    <section className={card}><p className="mb-3 text-sm text-ink/70">Choose any photo and the studio designs a banner for the computer and for phones (WebP, small and fast). It uses only the words you type. Your original photo is saved as it is.</p>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-forest/15 bg-cream p-3 text-sm"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={auto} onChange={async e => { const v = e.target.checked; setAuto(v); const r = await saveBannerSettings({ banner_auto_upload: v }); setMsg(r.message ?? ""); if (!r.ok) setAuto(!v); }} />Auto upload banner</label><span className="text-ink/60">{auto ? "ON: a new banner goes live on the homepage when you press Create." : "OFF (recommended): it is saved hidden, you switch it on after checking."}</span><Link href="/admin/banners" className="ml-auto text-forest underline">Homepage banners →</Link></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className={lbl} htmlFor="bf">1. Photo (JPG, PNG, WebP, up to 12 MB)</label><input id="bf" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={e => pick(e.target.files?.[0] ?? null)} /></div>
        <div><label className={lbl} htmlFor="bp">…or use a product photo</label><select id="bp" className={inp} value={prodSel} onChange={e => { setProdSel(e.target.value); fromProduct(e.target.value); }}><option value="">Choose a product</option>{products.filter(p => p.image).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className={lbl} htmlFor="bh">Headline</label><input id="bh" className={inp} maxLength={80} value={head} onChange={e => setHead(e.target.value)} placeholder="e.g. Glow, naturally" /></div>
        <div><label className={lbl} htmlFor="bs">Sub-text</label><input id="bs" className={inp} maxLength={140} value={sub} onChange={e => setSub(e.target.value)} /></div>
        <div><label className={lbl} htmlFor="bc">Button text (empty = no button)</label><input id="bc" className={inp} maxLength={24} value={cta} onChange={e => setCta(e.target.value)} /></div>
        <div><label className={lbl} htmlFor="bl">Link (e.g. /shop, /sale)</label><input id="bl" className={inp} value={link} onChange={e => setLink(e.target.value)} /></div>
        <div><label className={lbl} htmlFor="bt">Layout</label><select id="bt" className={inp} value={tpl} onChange={e => setTpl(e.target.value as Template)}>{TEMPLATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className={lbl} htmlFor="bfo">Keep this part of the photo in view</label><select id="bfo" className={inp} value={focus} onChange={e => setFocus(Number(e.target.value))}>{FOCUS.map((f, i) => <option key={f[0]} value={i}>{f[0]}</option>)}</select></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="ba">Picture description (for blind visitors and Google)</label><input id="ba" className={inp} maxLength={160} value={alt} onChange={e => setAlt(e.target.value)} /></div>
        <div><label className={lbl} htmlFor="bd1">Show from (optional)</label><input id="bd1" type="date" className={inp} value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div><label className={lbl} htmlFor="bd2">Show until (optional)</label><input id="bd2" type="date" className={inp} value={until} onChange={e => setUntil(e.target.value)} /></div>
        <div><label className={lbl} htmlFor="bo">Order (0 = first)</label><input id="bo" type="number" className={inp} value={order} onChange={e => setOrder(Number(e.target.value))} /></div></div>
      {err && <p role="alert" className="mt-3 text-sm font-medium text-red-700">⚠ {err}</p>}{msg && <p role="status" className="mt-3 text-sm font-medium text-green-800">{msg}</p>}</section>
    {bmp && <section className={card}><h2 className="mb-3 font-display text-2xl font-semibold text-forest">Preview</h2>
      <p className="mb-1 text-xs font-semibold uppercase text-ink/60">Computer</p><canvas ref={dRef} aria-label="Desktop banner preview" className="w-full rounded-lg border border-forest/15" />
      <p className="mb-1 mt-4 text-xs font-semibold uppercase text-ink/60">Phone</p><canvas ref={mRef} aria-label="Phone banner preview" className="w-48 rounded-lg border border-forest/15" />
      <div className="mt-4 flex flex-wrap items-center gap-3"><button className={btn} disabled={!!busy} onClick={save}>{busy || (auto ? "Create & put on homepage" : "Create banner (saved hidden)")}</button>
        {Object.keys(BANNER_SIZES).map(k => <button key={k} className={btn2} disabled={!!busy} onClick={() => download(k)}>Download {BANNER_SIZES[k].w}×{BANNER_SIZES[k].h}</button>)}</div></section>}
  </div>);
}

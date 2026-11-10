"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
import { saveCategoryButton } from "@/app/admin/actions-extra";
import { btn, btn2, card, lbl } from "./ui";
export interface ButtonItem { slug: string; name: string; image: string; custom: boolean }
const OK = ["image/jpeg", "image/png", "image/webp"];
/** Centre-crops any picture to a square and saves it as a 600×600 WebP. */
async function squareWebp(f: File, size = 600): Promise<{ blob: Blob; w: number; h: number }> {
  const b = await createImageBitmap(f); const s = Math.min(b.width, b.height); const c = document.createElement("canvas"); c.width = size; c.height = size; const x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, size, size); x.drawImage(b, (b.width - s) / 2, (b.height - s) / 2, s, s, 0, 0, size, size); const w = b.width, h = b.height; b.close();
  const blob = await new Promise<Blob>((res, rej) => c.toBlob(bl => (bl ? res(bl) : rej(new Error("Could not convert the picture."))), "image/webp", 0.9)); return { blob, w, h };
}
export default function CategoryButtonManager({ items }: { items: ButtonItem[] }) {
  const router = useRouter(); const [busy, setBusy] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const upload = async (it: ButtonItem, f: File | undefined) => {
    setErr(""); setMsg(""); if (!f) return; if (!OK.includes(f.type) || f.size > 12 * 1024 * 1024) { setErr("Use a JPG, PNG or WebP picture up to 12 MB."); return; }
    setBusy(it.slug); try {
      const { blob, w, h } = await squareWebp(f); const sb = browserClient(); const path = `category-buttons/${it.slug}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;
      const { error } = await sb.storage.from("media").upload(path, blob, { cacheControl: "31536000", upsert: false, contentType: "image/webp" }); if (error) throw new Error(`Upload failed: ${error.message}`);
      const url = sb.storage.from("media").getPublicUrl(path).data.publicUrl; const r = await saveCategoryButton(it.slug, url);
      if (r.ok) { setMsg(`${it.name}: ${r.message}${Math.abs(w / h - 1) > 0.04 ? ` (Your picture was ${w}×${h}, not square, so the middle part is used.)` : ""}`); router.refresh(); } else setErr(r.message ?? "Could not save.");
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(""); }
  };
  const clear = async (it: ButtonItem) => { if (!confirm(`Remove the picture of the ${it.name} button?`)) return; setErr(""); setMsg(""); setBusy(it.slug); try { const r = await saveCategoryButton(it.slug, null); if (r.ok) { setMsg(`${it.name}: ${r.message}`); router.refresh(); } else setErr(r.message ?? "Could not save."); } finally { setBusy(""); } };
  return (<section className={card}>
    <h2 className="mb-1 font-display text-2xl font-semibold text-forest">Category buttons (round pictures on the homepage)</h2>
    <div className="mb-3 rounded-lg border border-forest/15 bg-cream p-3 text-sm"><b>Picture size: 600 × 600 px (square).</b> It is shown as a circle, so keep the important part in the middle. JPG, PNG or WebP up to 12 MB. If your picture is not square, the middle part is used automatically. Without your own picture the button shows the newest product photo of that category.</div>
    {(msg || err) && <p role="status" className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${err ? "bg-red-50 text-red-800" : "bg-green-50 text-green-900"}`}>{err || msg}</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(it => (
      <article key={it.slug} className="flex items-center gap-4 rounded-xl border border-forest/15 p-3">
        <span className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full p-[3px] shadow-[0_10px_20px_-6px_rgb(var(--forest)/0.45)] ring-1 ring-gold/40" style={{ background: "linear-gradient(145deg,#fff,#e9efe6)" }}>
          <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-white text-xl font-semibold text-forest shadow-[inset_0_-6px_10px_rgb(var(--forest)/0.18)]">{it.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.image} alt="" className="h-full w-full object-cover" /> : it.name[0]}</span>
          <span aria-hidden="true" className="pointer-events-none absolute left-2 top-1.5 h-5 w-8 rotate-[-30deg] rounded-full bg-white/50 blur-[2px]" />
        </span>
        <div className="min-w-0 flex-1"><p className="font-semibold text-forest">{it.name}</p><p className="mb-2 text-xs text-ink/60">{it.custom ? "Your picture" : it.image ? "Automatic (product photo)" : "No picture yet"}</p>
          <label className={`${btn} inline-block cursor-pointer text-center ${busy ? "pointer-events-none opacity-60" : ""}`}>{busy === it.slug ? "Saving…" : it.custom ? "Replace picture" : "Upload picture"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!!busy} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; void upload(it, f); }} aria-label={`Upload the ${it.name} category button picture`} /></label>
          {it.custom && <button type="button" className={`${btn2} ml-2`} disabled={!!busy} onClick={() => clear(it)}>Remove</button>}</div>
      </article>))}</div>
    <p className="mt-3 text-xs text-ink/60"><span className={lbl}>Tip</span> After saving, open the homepage and press Ctrl+Shift+R to see the new circle.</p>
  </section>);
}

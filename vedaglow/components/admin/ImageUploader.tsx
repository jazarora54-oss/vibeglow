"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Trash2, Upload } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
import { fitImage, type FitMode } from "@/lib/imageFit";
import { btn2, inp } from "./ui";
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
/** Uploads to Supabase Storage (bucket "media") and returns public URLs. Used by products and banners. */
/** `fit` = resize every still picture to this exact size on upload (banners). GIF and video are never touched (it would remove the animation). */
export default function ImageUploader({ value, onChange, folder, multiple = true, allowVideo = false, fit }: { value: string[]; onChange: (v: string[]) => void; folder: string; multiple?: boolean; allowVideo?: boolean; fit?: { w: number; h: number } }) {
  const ref = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [url, setUrl] = useState(""); const [mode, setMode] = useState<FitMode>("auto"); const [note, setNote] = useState("");
  const upload = async (files: FileList | null) => {
    if (!files?.length) return; setBusy(true); setErr(""); setNote(""); const sb = browserClient(); const added: string[] = [];
    for (const f of Array.from(files)) {
      const isVideo = f.type === "video/mp4" || f.type === "video/webm";
      // Strict allow-list (SVG is NOT allowed: it can carry scripts). The database bucket enforces the same list again.
      if (!ALLOWED_IMAGES.includes(f.type) && !(allowVideo && isVideo)) { setErr(allowVideo ? "Only JPG, PNG, WebP, GIF images or MP4/WebM videos are allowed." : "Only JPG, PNG, WebP or GIF images are allowed."); continue; }
      const max = isVideo ? 25 : 5; if (f.size > max * 1024 * 1024) { setErr(`${f.name} is over ${max} MB. Please use a smaller file.`); continue; }
      let body: Blob = f, name = f.name, ctype = f.type;
      if (fit && !isVideo && f.type !== "image/gif") { const r = await fitImage(f, fit.w, fit.h, mode); body = r.blob; name = r.name; ctype = r.blob.type || f.type; setNote(r.note); }
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await sb.storage.from("media").upload(path, body, { cacheControl: "31536000", upsert: false, contentType: ctype });
      if (error) { setErr(`Upload failed: ${error.message}`); continue; }
      added.push(sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    }
    onChange(multiple ? [...value, ...added] : added.slice(0, 1)); setBusy(false); if (ref.current) ref.current.value = "";
  };
  const move = (i: number, d: number) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <div key={src + i} className="w-28 rounded-lg border border-forest/15 bg-cream p-1.5">
            {/\.(mp4|webm)(\?|$)/i.test(src) ? <video src={src} muted loop autoPlay playsInline className="h-24 w-full rounded object-cover" /> : <img src={src} alt="" className="h-24 w-full rounded object-contain" />}
            <div className="mt-1 flex items-center justify-between">
              {multiple && <button type="button" aria-label="Move left" onClick={() => move(i, -1)} className="p-1 text-forest disabled:opacity-30" disabled={i === 0}><ArrowLeft size={14} /></button>}
              <button type="button" aria-label="Remove image" onClick={() => onChange(value.filter((_, k) => k !== i))} className="p-1 text-red-700"><Trash2 size={14} /></button>
              {multiple && <button type="button" aria-label="Move right" onClick={() => move(i, 1)} className="p-1 text-forest disabled:opacity-30" disabled={i === value.length - 1}><ArrowRight size={14} /></button>}
            </div>
            {multiple && i === 0 && <p className="text-center text-[10px] font-semibold text-gold-dark">MAIN IMAGE</p>}
          </div>))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input ref={ref} type="file" accept={allowVideo ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"} multiple={multiple} onChange={e => upload(e.target.files)} className="hidden" />
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={`${btn2} flex items-center gap-2`}><Upload size={16} />{busy ? "Uploading…" : allowVideo ? "Upload image / GIF / video" : multiple ? "Upload images" : "Upload image"}</button>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="…or paste an image URL / /products/… path" className={`${inp} max-w-xs`} />
        <button type="button" onClick={() => { const t = url.trim(); if (t) { onChange(multiple ? [...value, t] : [t]); setUrl(""); } }} className={btn2}>Add</button>
      </div>
      {fit && <div className="mt-3 rounded-lg border border-forest/15 bg-cream p-3 text-xs text-ink/70">
        <label htmlFor={`fit-${folder}-${fit.w}`} className="mb-1 block font-semibold uppercase tracking-wide text-ink/60">Auto-fit to {fit.w} × {fit.h} px</label>
        <select id={`fit-${folder}-${fit.w}`} className={`${inp} max-w-sm`} value={mode} onChange={e => setMode(e.target.value as FitMode)}>
          <option value="auto">Automatic (recommended)</option><option value="fill">Fill the banner (edges may be trimmed)</option><option value="whole">Show the whole picture (blurred sides)</option></select>
        <p className="mt-1.5">Any picture size works: it is resized to the exact banner size when you upload it. Automatic fills the banner when the shape is close, otherwise it shows the whole picture on a soft blurred background so nothing is cut off. GIF and video stay as they are.</p>
        {note && <p role="status" className="mt-1.5 font-semibold text-green-700">✓ {note}</p>}</div>}
      {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
    </div>
  );
}

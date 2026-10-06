"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Trash2, Upload } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
import { btn2, inp } from "./ui";
/** Uploads to Supabase Storage (bucket "media") and returns public URLs. Used by products and banners. */
export default function ImageUploader({ value, onChange, folder, multiple = true, allowVideo = false }: { value: string[]; onChange: (v: string[]) => void; folder: string; multiple?: boolean; allowVideo?: boolean }) {
  const ref = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [url, setUrl] = useState("");
  const upload = async (files: FileList | null) => {
    if (!files?.length) return; setBusy(true); setErr(""); const sb = browserClient(); const added: string[] = [];
    for (const f of Array.from(files)) {
      const isVideo = f.type === "video/mp4" || f.type === "video/webm";
      if (!f.type.startsWith("image/") && !(allowVideo && isVideo)) { setErr(allowVideo ? "Only images, GIFs or MP4/WebM videos are allowed." : "Only image files are allowed."); continue; }
      const max = isVideo ? 25 : 5; if (f.size > max * 1024 * 1024) { setErr(`${f.name} is over ${max} MB. Please use a smaller file.`); continue; }
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await sb.storage.from("media").upload(path, f, { cacheControl: "31536000", upsert: false });
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
        <input ref={ref} type="file" accept={allowVideo ? "image/*,video/mp4,video/webm" : "image/*"} multiple={multiple} onChange={e => upload(e.target.files)} className="hidden" />
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={`${btn2} flex items-center gap-2`}><Upload size={16} />{busy ? "Uploading…" : allowVideo ? "Upload image / GIF / video" : multiple ? "Upload images" : "Upload image"}</button>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="…or paste an image URL / /products/… path" className={`${inp} max-w-xs`} />
        <button type="button" onClick={() => { const t = url.trim(); if (t) { onChange(multiple ? [...value, t] : [t]); setUrl(""); } }} className={btn2}>Add</button>
      </div>
      {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
    </div>
  );
}

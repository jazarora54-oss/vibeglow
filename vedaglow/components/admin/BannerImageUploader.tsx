"use client";
import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
import { fitToBanner, FIT_LABELS, type Fit } from "@/lib/creative/fit";
import { btn2, inp, lbl } from "./ui";
const TARGET = { desktop: { w: 1920, h: 650, kb: 450, label: "Computer 1920 × 650 px" }, mobile: { w: 750, h: 950, kb: 350, label: "Phone 750 × 950 px" } } as const;
/** Banner picture upload that fits itself: any picture is turned into the exact banner size (WebP), so it always looks right.
 *  GIF and MP4/WebM files cannot be re-drawn without losing the movement, so they are uploaded as they are. */
export default function BannerImageUploader({ kind, value, onChange, allowVideo = false }: { kind: "desktop" | "mobile"; value: string; onChange: (v: string) => void; allowVideo?: boolean }) {
  const T = TARGET[kind]; const ref = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [note, setNote] = useState(""); const [fit, setFit] = useState<Fit>("auto");
  const isVid = /\.(mp4|webm)(\?|$)/i.test(value);
  const upload = async (f: File | undefined) => {
    if (!f) return; setErr(""); setNote(""); setBusy(true);
    try {
      const sb = browserClient(); const rand = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; const raw = f.type === "image/gif" || f.type === "video/mp4" || f.type === "video/webm";
      if (raw) {
        if (f.type !== "image/gif" && !allowVideo) { setErr("Videos are only allowed for the computer banner."); return; } const max = f.type === "image/gif" ? 5 : 25; if (f.size > max * 1024 * 1024) { setErr(`${f.name} is over ${max} MB. Please use a smaller file.`); return; }
        const ext = f.type === "image/gif" ? "gif" : f.type === "video/mp4" ? "mp4" : "webm"; const path = `banners/${rand}.${ext}`;
        const { error } = await sb.storage.from("media").upload(path, f, { cacheControl: "31536000", upsert: false, contentType: f.type }); if (error) throw new Error(`Upload failed: ${error.message}`);
        onChange(sb.storage.from("media").getPublicUrl(path).data.publicUrl); setNote(f.type === "image/gif" ? "GIF uploaded as it is (animations cannot be re-fitted)." : "Video uploaded as it is."); return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 12 * 1024 * 1024) { setErr("Use a JPG, PNG or WebP picture up to 12 MB."); return; }
      const r = await fitToBanner(f, T.w, T.h, fit, T.kb); const path = `banners/${rand}.webp`;
      const { error } = await sb.storage.from("media").upload(path, r.blob, { cacheControl: "31536000", upsert: false, contentType: "image/webp" }); if (error) throw new Error(`Upload failed: ${error.message}`);
      onChange(sb.storage.from("media").getPublicUrl(path).data.publicUrl); setNote(`Your picture is ${r.srcW}×${r.srcH}. It was prepared as ${T.w}×${T.h}: ${r.how}.`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };
  return (<div>
    {value ? <div className={`relative overflow-hidden rounded-lg border border-forest/15 bg-cream ${kind === "desktop" ? "aspect-[1920/650] w-full max-w-xl" : "aspect-[750/950] w-40"}`}>{isVid ? <video src={value} muted loop autoPlay playsInline className="h-full w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="h-full w-full object-cover" />}</div>
      : <div className={`grid place-items-center rounded-lg border border-dashed border-forest/30 bg-cream text-xs text-ink/50 ${kind === "desktop" ? "aspect-[1920/650] w-full max-w-xl" : "aspect-[750/950] w-40"}`}>{T.label}</div>}
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input ref={ref} type="file" className="hidden" accept={allowVideo ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"} onChange={e => upload(e.target.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={`${btn2} flex items-center gap-2`}><Upload size={16} />{busy ? "Preparing…" : value ? "Replace picture" : "Upload picture"}</button>
      {value && <button type="button" disabled={busy} onClick={() => { onChange(""); setNote(""); }} className={`${btn2} flex items-center gap-2 text-red-700`}><Trash2 size={16} />Remove</button>}
      <label className="flex items-center gap-2 text-xs"><span className={lbl}>Fit</span><select className={`${inp} !w-auto !py-1.5 text-sm`} value={fit} onChange={e => setFit(e.target.value as Fit)} aria-label="How to fit the picture">{FIT_LABELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    </div>
    <p className="mt-1 text-xs text-ink/55">Best size: {T.label}. Other sizes are fitted for you automatically when you upload.</p>
    {note && <p role="status" className="mt-1 text-xs font-medium text-green-800">✓ {note}</p>}{err && <p role="alert" className="mt-1 text-sm text-red-700">{err}</p>}
  </div>);
}

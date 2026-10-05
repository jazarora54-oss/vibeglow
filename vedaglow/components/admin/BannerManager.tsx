"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Banner } from "@/lib/data/banners";
import { deleteBanner, saveBanner, type BannerInput } from "@/app/admin/actions";
import ImageUploader from "./ImageUploader";
import { btn, btn2, btnDanger, card, inp, lbl } from "./ui";
const blank = (n: number): BannerInput => ({ title: "", subtitle: "", button_text: "SHOP NOW", button_link: "/shop", image_url: "", sort_order: n, is_active: true });
export default function BannerManager({ banners }: { banners: Banner[] }) {
  const [edit, setEdit] = useState<BannerInput | null>(null); const [msg, setMsg] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof BannerInput>(k: K, v: BannerInput[K]) => setEdit(e => e && ({ ...e, [k]: v }));
  const save = () => edit && start(async () => { const r = await saveBanner(edit); if (!r.ok) { setMsg(r.message ?? "Could not save."); return; } setMsg(""); setEdit(null); router.refresh(); });
  const del = (id: string) => { if (confirm("Delete this banner?")) start(async () => { await deleteBanner(id); router.refresh(); }); };
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Homepage banners</h1>{!edit && <button className={btn} onClick={() => setEdit(blank(banners.length))}>+ Add banner</button>}</div>
    <p className="text-sm text-ink/60">Active banners replace the default hero on the homepage and slide automatically. Best size: wide image about 1600 × 600 px. With no active banners, the original hero is shown.</p>
    {edit && <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">{edit.id ? "Edit banner" : "New banner"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><span className={lbl}>Image *</span><ImageUploader multiple={false} folder="banners" value={edit.image_url ? [edit.image_url] : []} onChange={v => set("image_url", v[0] ?? "")} /></div>
        <div><label className={lbl}>Headline (optional)</label><input className={inp} value={edit.title} onChange={e => set("title", e.target.value)} /></div>
        <div><label className={lbl}>Sub-text (optional)</label><input className={inp} value={edit.subtitle} onChange={e => set("subtitle", e.target.value)} /></div>
        <div><label className={lbl}>Button text (empty = whole banner is a link)</label><input className={inp} value={edit.button_text} onChange={e => set("button_text", e.target.value)} /></div>
        <div><label className={lbl}>Link (e.g. /shop or /sale)</label><input className={inp} value={edit.button_link} onChange={e => set("button_link", e.target.value)} /></div>
        <div><label className={lbl}>Order (0 = first)</label><input type="number" className={inp} value={edit.sort_order} onChange={e => set("sort_order", Number(e.target.value))} /></div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={edit.is_active} onChange={e => set("is_active", e.target.checked)} />Show on website</label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={save}>{pending ? "Saving…" : "Save banner"}</button><button className={btn2} onClick={() => { setEdit(null); setMsg(""); }}>Cancel</button>{msg && <p role="alert" className="text-sm text-red-700">⚠ {msg}</p>}</div></section>}
    {banners.length === 0 && !edit && <p className={`${card} text-sm text-ink/60`}>No banners yet.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{banners.map(b => <div key={b.id} className={`${card} p-3`}><img src={b.image_url} alt="" className="h-36 w-full rounded-lg object-cover" /><p className="mt-2 font-semibold">{b.title || "(no headline)"} <span className="text-xs font-normal text-ink/50">· order {b.sort_order} · {b.is_active ? "visible" : "hidden"}</span></p>
      <div className="mt-2 flex gap-2"><button className={btn2} onClick={() => { setEdit({ ...b }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button className={btnDanger} disabled={pending} onClick={() => del(b.id)}>Delete</button></div></div>)}</div>
  </div>);
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBrand, type BrandInput } from "@/app/admin/actions";
import { colorIssues, isHex, ORIGINAL, PRESETS, textOn } from "@/lib/theme";
import ImageUploader from "./ImageUploader";
import { btn, btn2, card, inp, lbl } from "./ui";
export default function BrandForm({ initial }: { initial: BrandInput }) {
  const [v, setV] = useState<BrandInput>(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof BrandInput>(k: K, x: BrandInput[K]) => setV(o => ({ ...o, [k]: x }));
  const p = isHex(v.color_primary) ? v.color_primary : ORIGINAL.primary, a = isHex(v.color_accent) ? v.color_accent : ORIGINAL.accent, b = isHex(v.color_bg) ? v.color_bg : ORIGINAL.bg;
  const issues = colorIssues(v.color_primary, v.color_accent, v.color_bg); const blocked = issues.some(i => i.level === "block");
  const pick = (k: "color_primary" | "color_accent" | "color_bg", label: string, hint: string) => (<div key={k}><label className={lbl}>{label}</label>
    <div className="flex items-center gap-2"><input aria-label={label} type="color" className="h-10 w-14 cursor-pointer rounded border" value={isHex(v[k]) ? v[k] : k === "color_primary" ? ORIGINAL.primary : k === "color_accent" ? ORIGINAL.accent : ORIGINAL.bg} onChange={e => set(k, e.target.value.toUpperCase())} />
      <span className="text-xs text-ink/60">{v[k] || "original"}</span>{v[k] && <button type="button" className="text-xs font-semibold text-forest underline" onClick={() => set(k, "")}>Reset</button>}</div><p className="mt-1 text-xs text-ink/50">{hint}</p></div>);
  return (<div className="space-y-5">
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Logo</h2>
      <p className="mb-4 text-sm text-ink/60">Best: a PNG with a transparent background, wide or square, under 5 MB. It appears in the header and the footer.</p>
      <ImageUploader value={v.logo_url ? [v.logo_url] : []} onChange={x => set("logo_url", x[0] ?? "")} folder="brand" multiple={false} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className={lbl} htmlFor="la">Logo description (for screen readers and Google)</label><input id="la" className={inp} maxLength={120} value={v.logo_alt} placeholder="VEDAGLOW – Ancient Wisdom. Modern Glow." onChange={e => set("logo_alt", e.target.value)} /></div>
        <div><label className={lbl} htmlFor="ls">Header logo size</label><select id="ls" className={inp} value={v.logo_size} onChange={e => set("logo_size", e.target.value as BrandInput["logo_size"])}><option value="s">Small</option><option value="m">Medium</option><option value="l">Large</option></select></div></div></section>
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Colours</h2>
      <p className="mb-3 text-sm text-ink/60">Pick a ready set or choose your own. Buttons, menu, footer and highlights follow these colours.</p>
      <div className="mb-4 flex flex-wrap gap-2">{PRESETS.map(x => <button key={x.name} type="button" className={btn2} onClick={() => setV(o => ({ ...o, color_primary: x.primary === ORIGINAL.primary ? "" : x.primary, color_accent: x.accent === ORIGINAL.accent ? "" : x.accent, color_bg: x.bg === ORIGINAL.bg ? "" : x.bg }))}><span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: x.primary }} /><span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: x.accent }} />{x.name}</button>)}</div>
      <div className="grid gap-4 sm:grid-cols-3">{pick("color_primary", "Main colour", "Menu, footer, buttons.")}{pick("color_accent", "Accent colour", "Highlights, prices, badges.")}{pick("color_bg", "Page background", "Keep it light.")}</div>
      {issues.map((i, n) => <p key={n} role={i.level === "block" ? "alert" : undefined} className={`mt-3 text-sm font-medium ${i.level === "block" ? "text-red-700" : "text-amber-700"}`}>{i.level === "block" ? "⚠ " : "• "}{i.text}</p>)}
      <div className="mt-5 overflow-hidden rounded-xl border border-forest/15" style={{ background: b }}><p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/50">Preview</p>
        <div className="px-4 py-1.5 text-center text-xs" style={{ background: p, color: textOn(p) }}><b style={{ color: a }}>FREE SHIPPING</b> on orders over $50</div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">{v.logo_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.logo_url} alt="" className="h-12 w-auto object-contain" /> : <span className="font-display text-2xl font-semibold" style={{ color: p }}>VEDAGLOW</span>}
          <span className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: p, color: textOn(p) }}>Add to cart</span></div>
        <div className="px-4 pb-4"><p className="font-display text-xl font-semibold" style={{ color: p }}>Aloe Vera Gel</p><p className="font-semibold" style={{ color: a }}>$12.99</p></div></div></section>
    <div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={pending || blocked} onClick={() => start(async () => { const r = await saveBrand(v); setMsg({ ok: r.ok, t: r.ok ? "Saved. Live on the website." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save"}</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>
  </div>);
}

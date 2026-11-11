"use client";
import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { saveBrand, type BrandInput } from "@/app/admin/actions";
import { autoText, colorIssues, FONT_PAIRS, isHex, onColor, ORIGINAL, themeVars, THEMES, type Theme } from "@/lib/theme";
import ImageUploader from "./ImageUploader";
import { btn, btn2, card, inp, lbl } from "./ui";
type Look = Pick<BrandInput, "color_primary" | "color_accent" | "color_bg" | "color_text" | "theme_id" | "font_id" | "style_3d" | "text_size">;
/** The real website classes, with the chosen colours / fonts / 3D switched on only inside this box. So the preview is the real look. */
const varsOf = (l: Look): CSSProperties => Object.fromEntries(themeVars(l)) as CSSProperties;
const themeLook = (t: Theme, threeD: boolean): Look => ({ color_primary: t.id === "original" ? "" : t.primary, color_accent: t.id === "original" ? "" : t.accent, color_bg: t.id === "original" ? "" : t.bg, color_text: "", theme_id: t.id, font_id: t.font === "classic" ? "" : t.font, style_3d: threeD, text_size: "m" });
function MiniShop({ look, logo }: { look: Look; logo?: string }) {
  return (<div aria-hidden="true" style={varsOf(look)} data-3d={look.style_3d ? "on" : undefined} className="pointer-events-none select-none overflow-hidden rounded-xl border border-black/10 bg-cream font-sans text-ink">
    <div className="bg-forest px-3 py-1 text-center text-[10px] text-onforest"><b className="text-goldonforest">FREE SHIPPING</b> on orders over $49</div>
    <div className="flex items-center justify-between px-3 py-2">{logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt="" className="h-7 w-auto object-contain" /> : <span className="font-display text-xl font-semibold text-forest">VEDAGLOW</span>}<span className="text-[10px] text-ink/60">Cart (2)</span></div>
    <nav className="flex gap-3 bg-forest px-3 py-1.5 text-[10px] font-semibold text-onforest"><span className="border-b-2 border-goldonforest text-goldonforest">HOME</span><span>SHOP ALL</span><span>NEW</span><span className="text-goldonforest">SALE</span></nav>
    <div className="grid grid-cols-2 gap-2 p-3">
      <article className="rounded-xl border border-forest/10 bg-white p-2 shadow-card"><div className="h-9 rounded-lg bg-forest-100" /><p className="mt-1.5 font-display text-sm font-semibold leading-tight text-forest">Aloe Vera Gel</p><p className="text-[10px] text-ink/60">Soothing daily care</p><p className="mt-0.5 text-xs font-semibold text-gold">$12.99</p><button type="button" disabled tabIndex={-1} className="mt-1.5 w-full rounded-md bg-gold px-2 py-1 text-[10px] font-semibold text-ongold">Add to cart</button></article>
      <div className="flex flex-col justify-center"><p className="font-display text-base font-semibold leading-tight text-forest">Ancient Wisdom. Modern Glow.</p><p className="mt-1 text-[10px] text-ink/70">Pure, natural and effective care.</p><button type="button" disabled tabIndex={-1} className="mt-2 w-fit rounded-md bg-forest px-3 py-1 text-[10px] font-semibold text-onforest">SHOP NOW</button></div></div>
    <div className="bg-forest px-3 py-1.5 text-center text-[9px] text-onforest/80">© VEDAGLOW · Footer</div></div>);
}
export default function BrandForm({ initial }: { initial: BrandInput }) {
  const [v, setV] = useState<BrandInput>(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof BrandInput>(k: K, x: BrandInput[K]) => setV(o => ({ ...o, [k]: x }));
  const p = isHex(v.color_primary) ? v.color_primary : ORIGINAL.primary, a = isHex(v.color_accent) ? v.color_accent : ORIGINAL.accent, b = isHex(v.color_bg) ? v.color_bg : ORIGINAL.bg;
  const autoInk = autoText(isHex(v.color_primary) ? p : "", b, v.theme_id), ownInk = isHex(v.color_text), ink = ownInk ? v.color_text : autoInk;
  const issues = colorIssues(v.color_primary, v.color_accent, v.color_bg, v.color_text); const blocked = issues.some(i => i.level === "block");
  const look: Look = v; const fontId = v.font_id || "classic";
  const apply = (t: Theme) => { const l = themeLook(t, v.style_3d); setV(o => ({ ...o, color_primary: l.color_primary, color_accent: l.color_accent, color_bg: l.color_bg, color_text: "", theme_id: t.id, font_id: l.font_id })); setMsg(null); };
  const reset = () => { setV(o => ({ ...o, color_primary: "", color_accent: "", color_bg: "", color_text: "", theme_id: "", font_id: "", style_3d: false, text_size: "m" })); setMsg(null); };
  const own = (k: "color_primary" | "color_accent" | "color_bg", x: string) => setV(o => ({ ...o, [k]: x, theme_id: "" })); // changing a colour by hand = your own look
  const pick = (k: "color_primary" | "color_accent" | "color_bg", label: string, hint: string, def: string) => (<div key={k}><label className={lbl}>{label}</label>
    <div className="flex items-center gap-2"><input aria-label={label} type="color" className="h-10 w-14 cursor-pointer rounded border" value={isHex(v[k]) ? v[k] : def} onChange={e => own(k, e.target.value.toUpperCase())} />
      <span className="text-xs text-ink/60">{v[k] || "original"}</span>{v[k] && <button type="button" className="text-xs font-semibold text-forest underline" onClick={() => own(k, "")}>Reset</button>}</div><p className="mt-1 text-xs text-ink/50">{hint}</p></div>);
  const chip = (bg: string, fg: string, t: string) => <span className="inline-flex items-center rounded-md border border-black/10 px-2.5 py-1 text-xs font-semibold" style={{ background: bg, color: fg }}>{t}</span>;
  return (<div className="space-y-5">
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Logo</h2>
      <p className="mb-4 text-sm text-ink/60">Best: a PNG with a transparent background, wide or square, under 5 MB. It appears in the header and the footer.</p>
      <ImageUploader value={v.logo_url ? [v.logo_url] : []} onChange={x => set("logo_url", x[0] ?? "")} folder="brand" multiple={false} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className={lbl} htmlFor="la">Logo description (for screen readers and Google)</label><input id="la" className={inp} maxLength={120} value={v.logo_alt} placeholder="VEDAGLOW – Ancient Wisdom. Modern Glow." onChange={e => set("logo_alt", e.target.value)} /></div>
        <div><label className={lbl} htmlFor="ls">Header logo size</label><select id="ls" className={inp} value={v.logo_size} onChange={e => set("logo_size", e.target.value as BrandInput["logo_size"])}><option value="s">Small</option><option value="m">Medium</option><option value="l">Large</option></select></div></div></section>

    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Ready-made themes</h2>
      <p className="mb-4 text-sm text-ink/60">Tap a theme: the colours, text colour and fonts of the whole website change together (menu, buttons, footer, cards, banners). Each preview below is the real look{v.style_3d ? ", in 3D" : ""}. Then press <b>Save</b>.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{THEMES.map(t => { const on = v.theme_id === t.id; return (
        <button key={t.id} type="button" aria-pressed={on} onClick={() => apply(t)} className={`rounded-2xl border-2 bg-white p-2 text-left transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-gold ${on ? "border-forest ring-2 ring-gold" : "border-forest/10"}`}>
          <MiniShop look={themeLook(t, v.style_3d)} /><span className="mt-2 flex items-center justify-between gap-2 px-1"><span><span className="block text-sm font-semibold">{t.name}</span><span className="block text-xs text-ink/60">{t.tag}</span></span>
            {on ? <span className="rounded-full bg-forest px-2.5 py-0.5 text-[11px] font-semibold text-onforest">✓ Selected</span> : <span className="flex gap-1" aria-hidden="true"><i className="h-4 w-4 rounded-full border border-black/10" style={{ background: t.primary }} /><i className="h-4 w-4 rounded-full border border-black/10" style={{ background: t.accent }} /><i className="h-4 w-4 rounded-full border border-black/10" style={{ background: t.bg }} /></span>}</span></button>); })}</div></section>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"><div className="space-y-5">
      <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Your own colours</h2>
        <p className="mb-3 text-sm text-ink/60">Pick any colours you like. The text on buttons, the menu and the footer switches between white and dark <b>by itself</b>, so it never matches its background.</p>
        <div className="grid gap-4 sm:grid-cols-3">{pick("color_primary", "Main colour", "Menu, footer, buttons, headings.", ORIGINAL.primary)}{pick("color_accent", "Accent colour", "Highlights, prices, badges.", ORIGINAL.accent)}{pick("color_bg", "Page background", "Keep it light.", ORIGINAL.bg)}</div>
        <div className="mt-4 rounded-xl border border-forest/10 bg-cream p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/60">Automatic text colours (readable on each colour)</p>
          <div className="flex flex-wrap gap-2">{chip(p, onColor(p), "Text on main colour")}{chip(a, onColor(a), "Text on accent colour")}{chip(b, ink, "Website text")}</div></div>
        <div className="mt-4"><span className={lbl}>Website text colour</span>
          <div className="flex flex-wrap items-center gap-3"><input aria-label="Website text colour" type="color" className="h-10 w-14 cursor-pointer rounded border" value={ink} onChange={e => set("color_text", e.target.value.toUpperCase())} />
            <span className="text-xs text-ink/60">{ownInk ? `Your own: ${v.color_text}` : `Automatic: ${autoInk.toUpperCase()}`}</span>{ownInk && <button type="button" className="text-xs font-semibold text-forest underline" onClick={() => set("color_text", "")}>Back to automatic</button>}</div>
          <p className="mt-1 text-xs text-ink/50">Paragraphs, product names and labels. Automatic picks a dark colour that matches your theme and is easy to read.</p></div>
        {issues.map((i, n) => <p key={n} role={i.level === "block" ? "alert" : undefined} className={`mt-3 text-sm font-medium ${i.level === "block" ? "text-red-700" : "text-amber-700"}`}>{i.level === "block" ? "⚠ " : "• "}{i.text}</p>)}</section>

      <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Fonts (text style)</h2>
        <p className="mb-3 text-sm text-ink/60">Choose how headings and normal text look. It changes everywhere on the website.</p>
        <div className="grid gap-3 sm:grid-cols-2">{FONT_PAIRS.map(f => { const on = fontId === f.id; return (
          <button key={f.id} type="button" aria-pressed={on} onClick={() => set("font_id", f.id === "classic" ? "" : f.id)} className={`rounded-xl border-2 bg-white p-3 text-left transition hover:shadow-card ${on ? "border-forest ring-2 ring-gold" : "border-forest/10"}`}>
            <span className="block text-2xl font-semibold leading-tight text-forest" style={{ fontFamily: `var(${f.d}), Georgia, serif` }}>Aloe Vera Gel</span>
            <span className="mt-1 block text-sm text-ink/75" style={{ fontFamily: `var(${f.s}), system-ui, sans-serif` }}>Pure, natural care for every day.</span>
            <span className="mt-1.5 flex items-center justify-between text-xs"><b>{f.name}</b><span className="text-ink/50">{f.note}{on ? " · ✓" : ""}</span></span></button>); })}</div>
        <div className="mt-4"><span className={lbl}>Text size</span><div className="flex flex-wrap gap-2" role="group" aria-label="Text size">{([["s", "Smaller"], ["m", "Normal"], ["l", "Larger"]] as const).map(([k, n]) => <button key={k} type="button" aria-pressed={v.text_size === k} onClick={() => set("text_size", k)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${v.text_size === k ? "border-forest bg-forest text-onforest" : "border-forest/25 bg-white text-forest"}`}>{n}</button>)}</div></div></section>

      <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">3D style</h2>
        <label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" role="switch" className="mt-0.5 h-5 w-5 accent-forest" checked={v.style_3d} onChange={e => set("style_3d", e.target.checked)} /><span><b>Turn on 3D look</b><br /><span className="text-ink/60">Buttons get a shiny gradient and press down when tapped, cards float with deep shadows and lift when you hover, the menu and footer get depth. It works with every theme. Turn it off any time.</span></span></label></section>
    </div>
      <aside className="lg:sticky lg:top-4 lg:self-start"><section className={card}><h2 className="mb-1 font-display text-xl font-semibold text-forest">Live preview</h2><p className="mb-3 text-xs text-ink/60">Your choices so far (not saved until you press Save).</p><MiniShop look={look} logo={v.logo_url} /></section></aside></div>

    <div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={pending || blocked} onClick={() => start(async () => { const r = await saveBrand(v); setMsg({ ok: r.ok, t: r.ok ? "Saved. Live on the website." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save"}</button>
      <button type="button" className={btn2} disabled={pending} onClick={reset}>Back to original look</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>
  </div>);
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePromo, type PromoInput } from "@/app/admin/actions";
import { btn, card, inp, lbl } from "./ui";
export default function PromoForm({ initial }: { initial: PromoInput }) {
  const [v, setV] = useState<PromoInput>(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof PromoInput>(k: K, x: PromoInput[K]) => setV(o => ({ ...o, [k]: x }));
  return (<div className="space-y-5">
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Top bar message</h2>
      <p className="mb-4 text-sm text-ink/60">The green strip above the menu. Example: <i>Diwali Sale: 20% OFF everything</i> or <i>Buy 2 Get 1 Free on Hair Care</i>. Leave empty to show only the free-shipping offer (if you set one in Settings).</p>
      <label className={lbl} htmlFor="tb">Your message</label><input id="tb" className={inp} maxLength={160} value={v.topbar_text} placeholder="Diwali Sale: Buy 2 Get 1 Free!" onChange={e => set("topbar_text", e.target.value)} />
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={v.topbar_show_shipping} onChange={e => set("topbar_show_shipping", e.target.checked)} />Also show “Free shipping on orders over $X” before my message</label></section>
    <section className={card}><div className="mb-1 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-semibold text-forest">Sale pop-up</h2>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={v.popup_enabled} onChange={e => set("popup_enabled", e.target.checked)} />Show the pop-up on the website</label></div>
      <p className="mb-4 text-sm text-ink/60">A small window that opens for visitors. If they close it, it does not come back for 7 days (or straight away when you change the text).</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={lbl} htmlFor="pt">Title</label><input id="pt" className={inp} maxLength={80} value={v.popup_title} placeholder="Festive Sale: 20% OFF" onChange={e => set("popup_title", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="pm">Message</label><textarea id="pm" rows={3} maxLength={400} className={inp} value={v.popup_message} placeholder="Buy 2 Get 1 Free on all Hair Care. Offer ends Sunday!" onChange={e => set("popup_message", e.target.value)} /></div>
        <div><label className={lbl} htmlFor="pc">Coupon code (optional)</label><input id="pc" className={`${inp} uppercase`} maxLength={40} value={v.popup_code} placeholder="FESTIVE20" onChange={e => set("popup_code", e.target.value)} /><p className="mt-1 text-xs text-ink/50">Create the same code in admin → Coupons, otherwise it will not work at checkout.</p></div>
        <div><label className={lbl} htmlFor="pd">Show after (seconds)</label><input id="pd" type="number" min={0} max={60} className={inp} value={v.popup_delay} onChange={e => set("popup_delay", Number(e.target.value))} /></div>
        <div><label className={lbl} htmlFor="pb">Button text</label><input id="pb" className={inp} maxLength={30} value={v.popup_button_text} onChange={e => set("popup_button_text", e.target.value)} /></div>
        <div><label className={lbl} htmlFor="pl">Button goes to</label><input id="pl" className={inp} value={v.popup_button_link} placeholder="/shop or /sale" onChange={e => set("popup_button_link", e.target.value)} /></div></div>
      {(v.popup_title || v.popup_message) && <div className="mt-5 rounded-xl bg-cream-dark p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Preview</p>
        <div className="mx-auto max-w-xs overflow-hidden rounded-2xl bg-cream text-center shadow-lift"><div className="bg-forest px-5 pb-4 pt-5 text-white"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light">Special offer</p><p className="mt-1 font-display text-2xl font-semibold">{v.popup_title}</p></div>
          <div className="space-y-3 px-5 py-4 text-sm"><p className="whitespace-pre-line text-ink/80">{v.popup_message}</p>{v.popup_code && <p className="mx-auto w-fit rounded-lg border-2 border-dashed border-gold bg-white px-4 py-2 font-bold tracking-[0.15em] text-forest">{v.popup_code.toUpperCase()}</p>}<p className="rounded-lg bg-forest py-2.5 text-xs font-semibold text-white">{v.popup_button_text || "Shop now"}</p></div></div></div>}</section>
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Newsletter box (homepage)</h2>
      <p className="mb-4 text-sm text-ink/60">The sign-up box near the bottom of the homepage. Addresses are saved in admin → Subscribers. Only promise a discount here if you really give it: put the coupon code below (and create the same code in admin → Coupons), and mention it in the text.</p>
      <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className={lbl} htmlFor="nt">Heading</label><input id="nt" className={inp} maxLength={80} value={v.newsletter_title} onChange={e => set("newsletter_title", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="nx">Text under the heading</label><input id="nx" className={inp} maxLength={200} value={v.newsletter_text} onChange={e => set("newsletter_text", e.target.value)} /></div>
        <div><label className={lbl} htmlFor="nc">Welcome code (optional)</label><input id="nc" className={`${inp} uppercase`} maxLength={40} value={v.newsletter_code} placeholder="WELCOME10" onChange={e => set("newsletter_code", e.target.value)} /><p className="mt-1 text-xs text-ink/50">Shown after sign-up and in the welcome email. Empty = no code is mentioned.</p></div></div></section>
    <div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={() => start(async () => { const r = await savePromo(v); setMsg({ ok: r.ok, t: r.ok ? "Saved. Live on the website." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save"}</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>
  </div>);
}

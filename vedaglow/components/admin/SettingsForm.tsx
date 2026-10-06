"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/data/defaults";
import { btn, card, inp, lbl } from "./ui";
const F: [keyof SiteSettings, string, string][] = [
  ["store_name", "Store name", "VEDAGLOW"], ["tagline", "Tagline", "Ancient Wisdom. Modern Glow."], ["email", "Support email", "support@yourdomain.com"], ["phone", "Phone", "+1 555 123 4567"],
  ["whatsapp", "WhatsApp number (with country code)", "+15551234567"], ["hours", "Opening / support hours", "Mon–Sat, 9am–6pm"]];
const SOCIAL: [keyof SiteSettings, string][] = [["instagram", "Instagram link"], ["facebook", "Facebook page link"], ["tiktok", "TikTok link"], ["youtube", "YouTube channel link"]];
export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [v, setV] = useState(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const set = (k: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  return (<div className="space-y-5">
    <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">Store &amp; contact details</h2>
      <div className="grid gap-4 sm:grid-cols-2">{F.map(([k, l, ph]) => <div key={k}><label className={lbl} htmlFor={k}>{l}</label><input id={k} className={inp} value={v[k]} placeholder={ph} onChange={set(k)} /></div>)}
        <div className="sm:col-span-2"><label className={lbl} htmlFor="addr">Address (optional)</label><textarea id="addr" rows={2} className={inp} value={v.address} onChange={set("address")} /></div></div>
      <p className="mt-2 text-xs text-ink/50">These show in the website footer and on the Contact page. Empty fields are hidden.</p></section>
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Social media links</h2><p className="mb-4 text-sm text-ink/60">Add a link when you create the account. It appears in the website footer automatically. Empty ones stay hidden.</p>
      <div className="grid gap-4 sm:grid-cols-2">{SOCIAL.map(([k, l]) => <div key={k}><label className={lbl} htmlFor={k}>{l}</label><input id={k} className={inp} value={v[k]} placeholder="https://…" onChange={set(k)} /></div>)}</div></section>
    <div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={() => start(async () => { const r = await saveSettings(v); setMsg({ ok: r.ok, t: r.ok ? "Saved. Live on the website." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save settings"}</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>
  </div>);
}

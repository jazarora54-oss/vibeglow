"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/data/defaults";
import { btn, card, inp, lbl } from "./ui";
import { US_STATES } from "@/lib/shipping/rules";
const F: [keyof SiteSettings, string, string][] = [
  ["store_name", "Store name", "VEDAGLOW"], ["tagline", "Tagline", "Ancient Wisdom. Modern Glow."], ["email", "Support email", "support@yourdomain.com"], ["phone", "Phone", "+1 555 123 4567"],
  ["whatsapp", "WhatsApp number (with country code)", "+15551234567"], ["hours", "Opening / support hours", "Mon–Sat, 9am–6pm"]];
const SOCIAL: [keyof SiteSettings, string][] = [["instagram", "Instagram link"], ["facebook", "Facebook page link"], ["tiktok", "TikTok link"], ["youtube", "YouTube channel link"]];
export default function SettingsForm({ initial, shippo }: { initial: SiteSettings; shippo: "off" | "test" | "live" }) {
  const [v, setV] = useState(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const set = (k: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  const setNum = (k: "free_shipping_over" | "default_flat_rate") => (e: React.ChangeEvent<HTMLInputElement>) => setV(x => ({ ...x, [k]: e.target.value === "" ? ("" as unknown as number) : Number(e.target.value) }));
  return (<div className="space-y-5">
    <section className={card}><h2 className="mb-4 font-display text-2xl font-semibold text-forest">Store &amp; contact details</h2>
      <div className="grid gap-4 sm:grid-cols-2">{F.map(([k, l, ph]) => <div key={k}><label className={lbl} htmlFor={k}>{l}</label><input id={k} className={inp} value={v[k]} placeholder={ph} onChange={set(k)} /></div>)}
        <div className="sm:col-span-2"><label className={lbl} htmlFor="addr">Address (optional)</label><textarea id="addr" rows={2} className={inp} value={v.address} onChange={set("address")} /></div></div>
      <p className="mt-2 text-xs text-ink/50">These show in the website footer and on the Contact page. Empty fields are hidden.</p></section>
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Social media links</h2><p className="mb-4 text-sm text-ink/60">Add a link when you create the account. It appears in the website footer automatically. Empty ones stay hidden.</p>
      <div className="grid gap-4 sm:grid-cols-2">{SOCIAL.map(([k, l]) => <div key={k}><label className={lbl} htmlFor={k}>{l}</label><input id={k} className={inp} value={v[k]} placeholder="https://…" onChange={set(k)} /></div>)}</div></section>
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Shipping</h2>
      <p className="mb-4 text-sm text-ink/60">Per-product shipping (free / flat / calculated) is set on each product. These are the store-wide numbers and your “ship from” address.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={lbl} htmlFor="fso">Free shipping on orders over (USD)</label><input id="fso" type="number" min={0} step="1" className={inp} value={v.free_shipping_over} onChange={setNum("free_shipping_over")} /><p className="mt-1 text-xs text-ink/50">0 = off. When the cart reaches this amount, shipping is free for the whole order.</p></div>
        <div><label className={lbl} htmlFor="dfr">Default flat shipping rate (USD)</label><input id="dfr" type="number" min={0} step="0.01" className={inp} value={v.default_flat_rate} onChange={setNum("default_flat_rate")} /><p className="mt-1 text-xs text-ink/50">Used by products set to “Flat rate” that have no price of their own.</p></div></div>
      <h3 className="mb-2 mt-6 font-semibold text-forest">Ship-from address (your return address)</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={lbl} htmlFor="sn">Name</label><input id="sn" className={inp} value={v.ship_name} placeholder="Your name or business" onChange={set("ship_name")} /></div>
        <div><label className={lbl} htmlFor="sc">Company (optional)</label><input id="sc" className={inp} value={v.ship_company} onChange={set("ship_company")} /></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="s1">Street address</label><input id="s1" className={inp} value={v.ship_street1} onChange={set("ship_street1")} /></div>
        <div className="sm:col-span-2"><label className={lbl} htmlFor="s2">Apt / Suite (optional)</label><input id="s2" className={inp} value={v.ship_street2} onChange={set("ship_street2")} /></div>
        <div><label className={lbl} htmlFor="ci">City</label><input id="ci" className={inp} value={v.ship_city} onChange={set("ship_city")} /></div>
        <div><label className={lbl} htmlFor="st">State</label><select id="st" className={inp} value={v.ship_state} onChange={set("ship_state")}><option value="">Select state</option>{Object.entries(US_STATES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
        <div><label className={lbl} htmlFor="zp">ZIP code</label><input id="zp" className={inp} value={v.ship_zip} placeholder="94541" onChange={set("ship_zip")} /></div>
        <div><label className={lbl} htmlFor="sp">Phone for labels (optional)</label><input id="sp" className={inp} value={v.ship_phone} placeholder="Uses your store phone if empty" onChange={set("ship_phone")} /></div></div>
      <p className={`mt-4 rounded-lg p-3 text-sm ${shippo === "off" ? "bg-amber-50 text-amber-900" : shippo === "test" ? "bg-blue-50 text-blue-900" : "bg-green-50 text-green-900"}`}>
        {shippo === "off" ? "Carrier connection: NOT connected. Calculated products use an estimate table. To get live USPS / UPS / FedEx prices and labels, add SHIPPO_API_KEY in Netlify (see the setup guide)." : shippo === "test" ? "Carrier connection: Shippo TEST mode. Prices work, but labels are fake and cost nothing. Switch to a live key when ready." : "Carrier connection: Shippo LIVE. Labels you buy are real and charged to your Shippo account."}</p></section>
    <div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={() => start(async () => { const r = await saveSettings(v); setMsg({ ok: r.ok, t: r.ok ? "Saved. Live on the website." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save settings"}</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>
  </div>);
}

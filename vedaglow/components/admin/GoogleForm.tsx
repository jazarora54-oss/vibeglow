"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGoogle } from "@/app/admin/actions";
import { btn, btn2, card, inp, lbl } from "./ui";
export default function GoogleForm({ initial, base, feedCount, skipped }: { initial: { ga_id: string; google_verify: string }; base: string; feedCount: number; skipped: string[] }) {
  const [v, setV] = useState(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [copied, setCopied] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setCopied(t); } catch { /* ignore */ } };
  const feed = `${base}/feed/google.xml`, map = `${base}/sitemap.xml`;
  const Row = (label: string, url: string) => (<div key={url}><span className={lbl}>{label}</span><div className="flex flex-wrap items-center gap-2"><code className="break-all rounded bg-cream-dark px-2 py-1 text-xs">{url}</code><button type="button" className={btn2} onClick={() => copy(url)}>{copied === url ? "Copied" : "Copy"}</button></div></div>);
  return (<div className="space-y-5">
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Google Analytics</h2>
      <p className="mb-3 text-sm text-ink/60">Shows how many people visit and which pages they open. In Google Analytics create a “Web” data stream for your website, then copy the Measurement ID (starts with <b>G-</b>). Leave empty to switch it off. Admin pages are never counted.</p>
      <label className={lbl} htmlFor="ga">Measurement ID</label><input id="ga" className={`${inp} max-w-xs uppercase`} maxLength={20} placeholder="G-ABC123XYZ" value={v.ga_id} onChange={e => setV(o => ({ ...o, ga_id: e.target.value }))} />
      <p className="mt-2 text-xs text-ink/50">If you sell to visitors in Europe or California, add a cookie notice and a privacy policy that mention Analytics (Admin → Pages).</p></section>
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Google Search Console</h2>
      <p className="mb-3 text-sm text-ink/60">Lets Google show you how the site appears in search. In Search Console add your website → choose “HTML tag” → paste the code here (the whole tag or just the code inside content=&quot;…&quot;).</p>
      <label className={lbl} htmlFor="gv">Verification code</label><input id="gv" className={inp} maxLength={200} value={v.google_verify} onChange={e => setV(o => ({ ...o, google_verify: e.target.value }))} />
      <div className="mt-4">{Row("Sitemap (submit this in Search Console → Sitemaps)", map)}</div></section>
    <section className={card}><h2 className="mb-1 font-display text-2xl font-semibold text-forest">Google Shopping feed</h2>
      <p className="mb-3 text-sm text-ink/60">A list of your products that Google Merchant Center reads by itself. It is always up to date: prices, stock and pictures follow admin → Products. In Merchant Center: Products → Feeds → add a feed → “Scheduled fetch” → paste this address.</p>
      {Row("Feed address", feed)}
      <p className="mt-3 text-sm"><b className="text-forest">{feedCount}</b> product{feedCount === 1 ? "" : "s"} in the feed.</p>
      {skipped.length > 0 && <p className="mt-1 text-xs text-amber-700">Left out (no picture, no price, or “hide from Google” is on): {skipped.slice(0, 8).join(", ")}{skipped.length > 8 ? ` and ${skipped.length - 8} more` : ""}.</p>}
      <p className="mt-2 text-xs text-ink/50">Shipping and tax rules for Google Shopping are set inside Merchant Center itself. Products without a barcode (GTIN) are sent as “no barcode”; add the GTIN in a product to improve matching.</p></section>
    <div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={() => start(async () => { const r = await saveGoogle(v); setMsg({ ok: r.ok, t: r.ok ? "Saved." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save"}</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div></div>);
}

"use client";
import { useState } from "react";
import { BellRing } from "lucide-react";
import { subscribeOffers } from "@/app/actions/store";
export default function OfferSignup({ productId }: { productId: string }) {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { const r = await subscribeOffers(productId, email); setMsg({ ok: r.ok, t: r.message }); if (r.ok) setEmail(""); } catch { setMsg({ ok: false, t: "Could not sign you up. Please try again." }); } setBusy(false); };
  return (
    <form onSubmit={go} className="mx-auto mt-8 max-w-7xl rounded-2xl border border-gold/40 bg-white p-5 shadow-card sm:flex sm:items-center sm:gap-6">
      <div className="mb-3 flex items-start gap-3 sm:mb-0 sm:flex-1"><BellRing className="mt-0.5 shrink-0 text-gold" /><div><p className="font-display text-2xl font-semibold text-forest">Get offers on this product</p><p className="text-sm text-ink/70">Leave your email and we will send you a special price if there is one. Unsubscribe any time.</p></div></div>
      <div className="flex gap-2 sm:w-[28rem]"><label htmlFor="osu" className="sr-only">Email</label><input id="osu" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="min-w-0 flex-1 rounded-lg border border-forest/20 px-3 py-2.5 text-sm focus:border-forest focus:outline-none" />
        <button disabled={busy} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-gold-dark disabled:opacity-50">{busy ? "…" : "NOTIFY ME"}</button></div>
      {msg && <p role="status" className={`mt-2 text-sm font-medium sm:mt-0 ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.t}</p>}
    </form>
  );
}

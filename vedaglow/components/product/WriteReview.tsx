"use client";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions/store";
export default function WriteReview({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false); const [stars, setStars] = useState(0); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [body, setBody] = useState(""); const [website, setWebsite] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition();
  const f = "mt-1 w-full rounded-md border border-forest/20 px-3 py-2";
  return (
    <div>
      <button type="button" onClick={() => { setOpen(!open); setMsg(null); }} aria-expanded={open} className="rounded-md border-2 border-forest px-5 py-2.5 text-sm font-semibold tracking-wide text-forest hover:bg-forest hover:text-white">WRITE A REVIEW</button>
      {open && (msg?.ok ? <p role="status" className="mt-4 max-w-xl rounded-lg bg-forest-100 p-4 text-sm text-forest">{msg.t}</p> :
        <form onSubmit={e => { e.preventDefault(); if (!stars) { setMsg({ ok: false, t: "Please choose a star rating." }); return; } start(async () => { try { const r = await submitReview({ product_id: productId, rating: stars, name, email, body, website }); setMsg({ ok: r.ok, t: r.message }); } catch { setMsg({ ok: false, t: "Something went wrong. Please try again." }); } }); }} className="fade-in mt-4 grid max-w-xl gap-3 rounded-2xl bg-white p-5 shadow-card">
          <div role="radiogroup" aria-label="Rating" className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <button type="button" key={i} role="radio" aria-checked={stars === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setStars(i)}><Star size={26} className={i <= stars ? "fill-gold text-gold" : "text-gold/40"} /></button>)}</div>
          <label className="text-sm font-medium">Name (shown with your review)<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} className={f} /></label>
          <label className="text-sm font-medium">Email (never shown; used to mark “Verified Purchase”)<input required type="email" maxLength={160} value={email} onChange={e => setEmail(e.target.value)} className={f} /></label>
          <label className="text-sm font-medium">Your review<textarea required minLength={10} maxLength={1500} rows={4} value={body} onChange={e => setBody(e.target.value)} className={f} /></label>
          <div aria-hidden="true" className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label></div>
          <p className="text-xs text-ink/60">Reviews are checked before they appear. Please keep it honest and about the product.</p>
          {msg && !msg.ok && <p role="alert" className="text-sm text-red-700">⚠ {msg.t}</p>}
          <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-forest px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "SENDING…" : "SUBMIT REVIEW"}</button></form>)}
    </div>
  );
}

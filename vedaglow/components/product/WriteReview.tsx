"use client";
import { useState } from "react";
import { Star } from "lucide-react";
// UI-only for now - no submission. Supabase `reviews` insert comes later.
export default function WriteReview() {
  const [open, setOpen] = useState(false); const [done, setDone] = useState(false); const [stars, setStars] = useState(5);
  return (
    <div>
      <button type="button" onClick={() => { setOpen(!open); setDone(false); }} aria-expanded={open} className="rounded-md border-2 border-forest px-5 py-2.5 text-sm font-semibold tracking-wide text-forest hover:bg-forest hover:text-white">WRITE A REVIEW</button>
      {open && (done ? <p role="status" className="mt-4 rounded-lg bg-forest-100 p-4 text-sm text-forest">Thanks! Customer reviews will be enabled soon.</p> :
        <form onSubmit={e => { e.preventDefault(); setDone(true); }} className="fade-in mt-4 grid max-w-xl gap-3 rounded-2xl bg-white p-5 shadow-card">
          <div role="radiogroup" aria-label="Rating" className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <button type="button" key={i} role="radio" aria-checked={stars === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setStars(i)}><Star size={24} className={i <= stars ? "fill-gold text-gold" : "text-gold/40"} /></button>)}</div>
          <label className="text-sm font-medium">Name<input required className="mt-1 w-full rounded-md border border-forest/20 px-3 py-2" /></label>
          <label className="text-sm font-medium">Your review<textarea required rows={3} className="mt-1 w-full rounded-md border border-forest/20 px-3 py-2" /></label>
          <button type="submit" className="justify-self-start rounded-md bg-forest px-5 py-2.5 text-sm font-semibold text-white">SUBMIT REVIEW</button></form>)}
    </div>
  );
}

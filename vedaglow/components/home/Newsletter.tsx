"use client";
import { useState } from "react";
// Step 2+: POST to /api/subscribe -> Supabase `email_subscribers`.
export default function Newsletter() {
  const [done, setDone] = useState(false);
  return (
    <section className="bg-forest py-14 text-white"><div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
      <div><h2 className="font-display text-3xl font-semibold">Subscribe &amp; get exclusive offers.</h2><p className="mt-1 text-white/70">New arrivals, sales and wellness tips. Get 10% off your first order.</p></div>
      {done ? <p className="font-semibold text-gold-light">Thanks! Check your inbox for WELCOME10.</p> :
      <form onSubmit={e => { e.preventDefault(); setDone(true); }} className="flex w-full max-w-md gap-2">
        <label htmlFor="nl" className="sr-only">Email address</label>
        <input id="nl" type="email" required placeholder="Enter your email" className="min-w-0 flex-1 rounded-md border-0 px-4 py-3 text-ink" />
        <button className="rounded-md bg-gold px-6 py-3 text-sm font-semibold hover:bg-gold-dark">SUBSCRIBE</button>
      </form>}
    </div></section>
  );
}

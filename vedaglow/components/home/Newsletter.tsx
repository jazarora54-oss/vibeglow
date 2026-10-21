"use client";
import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/actions/store";
/** Real sign-up: the address is saved in the database (admin -> Subscribers). Texts come from admin -> Popup & Top bar. */
export default function Newsletter({ title, text }: { title: string; text: string }) {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition();
  return (
    <section className="bg-forest py-14 text-white"><div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
      <div><h2 className="font-display text-3xl font-semibold">{title}</h2><p className="mt-1 text-white/70">{text}</p></div>
      {msg?.ok ? <p role="status" className="font-semibold text-gold-light">{msg.t}</p> :
      <form onSubmit={e => { e.preventDefault(); start(async () => { try { const r = await subscribeNewsletter(email); setMsg({ ok: r.ok, t: r.message }); } catch { setMsg({ ok: false, t: "Something went wrong. Please try again." }); } }); }} className="w-full max-w-md">
        <div className="flex gap-2"><label htmlFor="nl" className="sr-only">Email address</label>
          <input id="nl" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="min-w-0 flex-1 rounded-md border-0 px-4 py-3 text-ink" />
          <button disabled={pending} className="rounded-md bg-gold px-6 py-3 text-sm font-semibold hover:bg-gold-dark disabled:opacity-60">{pending ? "…" : "SUBSCRIBE"}</button></div>
        {msg && !msg.ok && <p role="alert" className="mt-2 text-sm text-red-200">⚠ {msg.t}</p>}</form>}
    </div></section>
  );
}

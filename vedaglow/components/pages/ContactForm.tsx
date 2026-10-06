"use client";
import { useState } from "react";
import { submitContact } from "@/app/actions/store";
const inp = "w-full rounded-lg border border-forest/20 bg-white px-3 py-2.5 text-sm focus:border-forest focus:outline-none";
export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "", website: "" }); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(x => ({ ...x, [k]: e.target.value }));
  const send = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setMsg(null);
    try { const r = await submitContact(f); setMsg({ ok: r.ok, t: r.message }); if (r.ok) setF({ name: "", email: "", subject: "", message: "", website: "" }); } catch { setMsg({ ok: false, t: "Could not send. Please try again." }); }
    setBusy(false); };
  return (
    <form onSubmit={send} className="space-y-3 rounded-2xl border border-forest/10 bg-white p-5 shadow-card">
      <h2 className="font-display text-2xl font-semibold text-forest">Send us a message</h2>
      <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="cn" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Name</label><input id="cn" required className={inp} value={f.name} onChange={set("name")} autoComplete="name" /></div>
        <div><label htmlFor="ce" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Email</label><input id="ce" type="email" required className={inp} value={f.email} onChange={set("email")} autoComplete="email" /></div></div>
      <div><label htmlFor="cs" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Subject (optional)</label><input id="cs" className={inp} value={f.subject} onChange={set("subject")} placeholder="e.g. Order VDG-20260101-ABCDE" /></div>
      <div><label htmlFor="cm" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Message</label><textarea id="cm" required rows={5} className={inp} value={f.message} onChange={set("message")} /></div>
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
      <button disabled={busy} className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-forest-500 disabled:opacity-50">{busy ? "SENDING…" : "SEND MESSAGE"}</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.t}</p>}
    </form>
  );
}

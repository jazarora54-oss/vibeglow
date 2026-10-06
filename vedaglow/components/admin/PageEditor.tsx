"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPage, savePage } from "@/app/admin/actions";
import { btn, btn2, card, inp, lbl } from "./ui";
export default function PageEditor({ slug, initial, defaultBody, defaultTitle, custom }: { slug: string; initial: { title: string; body: string }; defaultBody: string; defaultTitle: string; custom: boolean }) {
  const [t, setT] = useState(initial.title), [b, setB] = useState(initial.body); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  return (<div className="space-y-4">
    {!custom && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This page currently shows a <b>draft template</b>. Read it, change it to match your real policy, and press Save. (Templates are not legal advice.)</p>}
    <section className={card}><div className="space-y-4"><div><label className={lbl} htmlFor="pt">Page title</label><input id="pt" className={inp} value={t} onChange={e => setT(e.target.value)} /></div>
      <div><label className={lbl} htmlFor="pb">Page text</label><textarea id="pb" rows={22} className={`${inp} font-mono leading-relaxed`} value={b} onChange={e => setB(e.target.value)} />
        <p className="mt-1 text-xs text-ink/50">Formatting: <code>## Heading</code> · <code>- list item</code> · <code>**bold**</code> · <code>[link text](/contact)</code> · leave a blank line between paragraphs.</p></div></div></section>
    <div className="flex flex-wrap items-center gap-3">
      <button className={btn} disabled={pending} onClick={() => start(async () => { const r = await savePage(slug, t, b); setMsg({ ok: r.ok, t: r.ok ? "Saved. Live on the website." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save page"}</button>
      {custom && <button className={btn2} disabled={pending} onClick={() => confirm("Go back to the original draft text? Your edits will be lost.") && start(async () => { await resetPage(slug); setT(defaultTitle); setB(defaultBody); setMsg({ ok: true, t: "Reset to the draft." }); router.refresh(); })}>Reset to draft</button>}
      <a className="text-sm font-semibold text-forest underline" href={`/${slug}`} target="_blank" rel="noreferrer">View page ↗</a>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>
  </div>);
}

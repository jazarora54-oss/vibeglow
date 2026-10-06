"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFaq, loadDefaultFaqs, saveFaq, type FaqInput } from "@/app/admin/actions";
import { btn, btn2, btnDanger, card, inp, lbl } from "./ui";
export interface FaqRow { id: string; question: string; answer: string; keywords: string; sort_order: number; is_active: boolean }
const blank = (n: number): FaqInput => ({ question: "", answer: "", keywords: "", sort_order: n, is_active: true });
export default function FaqManager({ faqs }: { faqs: FaqRow[] }) {
  const [edit, setEdit] = useState<FaqInput | null>(null); const [msg, setMsg] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  const set = <K extends keyof FaqInput>(k: K, v: FaqInput[K]) => setEdit(e => e && ({ ...e, [k]: v }));
  const save = () => edit && start(async () => { const r = await saveFaq(edit); if (!r.ok) { setMsg(r.message ?? "Could not save."); return; } setMsg(""); setEdit(null); router.refresh(); });
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">FAQs &amp; chat answers</h1>{!edit && <button className={btn} onClick={() => setEdit(blank(faqs.length))}>+ Add question</button>}</div>
    <p className="text-sm text-ink/60">These appear on the FAQ page <b>and</b> the chat assistant uses them to answer customers automatically. Add <b>keywords</b> (words customers might type) to help it match.</p>
    {edit && <section className={card}><div className="grid gap-4">
      <div><label className={lbl}>Question</label><input className={inp} value={edit.question} onChange={e => set("question", e.target.value)} /></div>
      <div><label className={lbl}>Answer</label><textarea rows={4} className={inp} value={edit.answer} onChange={e => set("answer", e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-3"><div className="sm:col-span-2"><label className={lbl}>Keywords (separate with spaces)</label><input className={inp} value={edit.keywords} onChange={e => set("keywords", e.target.value)} placeholder="shipping delivery days arrive" /></div>
        <div><label className={lbl}>Order (0 = first)</label><input type="number" className={inp} value={edit.sort_order} onChange={e => set("sort_order", Number(e.target.value))} /></div></div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={edit.is_active} onChange={e => set("is_active", e.target.checked)} />Show on website &amp; use in chat</label></div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={save}>{pending ? "Saving…" : "Save"}</button><button className={btn2} onClick={() => { setEdit(null); setMsg(""); }}>Cancel</button>{msg && <p role="alert" className="text-sm text-red-700">⚠ {msg}</p>}</div></section>}
    {faqs.length === 0 && !edit && <div className={card}><p className="font-semibold">No saved FAQs yet.</p><p className="mb-3 mt-1 text-sm text-ink/70">The website is showing 9 built-in answers. Load them here to edit them, or add your own.</p><button className={btn} disabled={pending} onClick={() => start(async () => { await loadDefaultFaqs(); router.refresh(); })}>Load the 9 default FAQs</button></div>}
    <div className="space-y-3">{faqs.map(f => <div key={f.id} className={`${card} !p-4`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-forest">{f.question} {!f.is_active && <span className="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-normal">hidden</span>}</p><p className="mt-1 text-sm text-ink/70">{f.answer}</p></div>
      <div className="flex gap-2"><button className={btn2} onClick={() => { setEdit({ ...f }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button className={btnDanger} disabled={pending} onClick={() => confirm("Delete this FAQ?") && start(async () => { await deleteFaq(f.id); router.refresh(); })}>Delete</button></div></div></div>)}</div>
  </div>);
}

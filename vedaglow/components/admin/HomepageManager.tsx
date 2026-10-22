"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { saveHomepage } from "@/app/admin/actions";
import { HOME_SECTIONS, type HomeSection } from "@/lib/data/homeSections";
import { btn, btn2, card, inp } from "./ui";
export default function HomepageManager({ initial }: { initial: HomeSection[] }) {
  const [rows, setRows] = useState<HomeSection[]>(initial); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const move = (i: number, d: number) => setRows(r => { const a = [...r]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const upd = (i: number, p: Partial<HomeSection>) => setRows(r => r.map((x, n) => n === i ? { ...x, ...p } : x));
  return (<div className="space-y-4"><section className={`${card} space-y-2`}>
    {rows.map((r, i) => { const m = HOME_SECTIONS.find(x => x.key === r.key)!; return (<div key={r.key} className={`flex flex-wrap items-center gap-3 rounded-xl border border-forest/10 p-3 ${r.on ? "bg-white" : "bg-cream-dark opacity-70"}`}>
      <div className="flex flex-col"><button type="button" aria-label={`Move ${m.label} up`} className="p-1 text-forest disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button><button type="button" aria-label={`Move ${m.label} down`} className="p-1 text-forest disabled:opacity-30" disabled={i === rows.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button></div>
      <div className="min-w-[10rem] flex-1"><p className="font-semibold text-forest">{i + 1}. {m.label}</p><p className="text-xs text-ink/55">{m.help}</p></div>
      {m.titled && <input aria-label={`Heading for ${m.label}`} className={`${inp} max-w-[14rem]`} maxLength={60} placeholder={m.titled} value={r.title ?? ""} onChange={e => upd(i, { title: e.target.value })} />}
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={r.on} onChange={e => upd(i, { on: e.target.checked })} />Show</label></div>); })}</section>
    <div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={pending} onClick={() => start(async () => { const r = await saveHomepage(rows); setMsg({ ok: r.ok, t: r.ok ? "Saved. Live on the website." : r.message ?? "Failed" }); router.refresh(); })}>{pending ? "Saving…" : "Save"}</button>
      <button type="button" className={btn2} onClick={() => setRows(HOME_SECTIONS.map(m => ({ key: m.key, on: true })))}>Back to original order</button>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div></div>);
}

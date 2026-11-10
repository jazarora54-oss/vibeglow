"use client";
import { fmtDateTime } from "@/lib/format";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage, replyToMessage, setMessageRead } from "@/app/admin/actions";
import { btn, btn2, btnDanger, inp } from "./ui";
export interface Msg { id: string; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string; replied_at?: string | null; reply_text?: string | null }
export default function MessageRow({ m }: { m: Msg }) {
  const [pending, start] = useTransition(); const router = useRouter(); const [reply, setReply] = useState(""), [msg, setMsg] = useState("");
  return (<details className={`rounded-2xl border bg-white p-4 shadow-card ${m.is_read ? "border-forest/10" : "border-gold"}`} onToggle={e => { if ((e.target as HTMLDetailsElement).open && !m.is_read) start(async () => { await setMessageRead(m.id, true); router.refresh(); }); }}>
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2"><span><b className="text-forest">{m.name}</b> <span className="text-sm text-ink/60">&lt;{m.email}&gt;</span>{!m.is_read && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-ongold">NEW</span>}<br /><span className="text-sm">{m.subject || "(no subject)"}</span></span>
      <span className="text-xs text-ink/50">{fmtDateTime(m.created_at)}</span></summary>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
    {m.replied_at && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-900"><b>Replied {fmtDateTime(m.replied_at)}:</b> <span className="whitespace-pre-wrap">{m.reply_text}</span></p>}
    <div className="mt-3"><label className="mb-1 block text-xs font-semibold uppercase text-ink/60" htmlFor={`rp${m.id}`}>Reply from the website (sent from your business email)</label><textarea id={`rp${m.id}`} rows={3} maxLength={4000} className={inp} value={reply} onChange={e => setReply(e.target.value)} />
      <div className="mt-2 flex items-center gap-3"><button className={btn} disabled={pending || reply.trim().length < 2} onClick={() => start(async () => { const r = await replyToMessage(m.id, reply); setMsg(r.message ?? ""); if (r.ok) { setReply(""); router.refresh(); } })}>Send reply</button>{msg && <span role="status" className="text-sm text-ink/70">{msg}</span>}</div></div>
    <div className="mt-3 flex flex-wrap gap-2"><a className={btn2} href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject || "your message to VEDAGLOW"))}`}>Reply by email</a>
      <button className={btn2} disabled={pending} onClick={() => start(async () => { await setMessageRead(m.id, !m.is_read); router.refresh(); })}>{m.is_read ? "Mark unread" : "Mark read"}</button>
      <button className={btnDanger} disabled={pending} onClick={() => confirm("Delete this message?") && start(async () => { await deleteMessage(m.id); router.refresh(); })}>Delete</button></div></details>);
}

"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage, setMessageRead } from "@/app/admin/actions";
import { btn2, btnDanger } from "./ui";
export interface Msg { id: string; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string }
export default function MessageRow({ m }: { m: Msg }) {
  const [pending, start] = useTransition(); const router = useRouter();
  return (<details className={`rounded-2xl border bg-white p-4 shadow-card ${m.is_read ? "border-forest/10" : "border-gold"}`} onToggle={e => { if ((e.target as HTMLDetailsElement).open && !m.is_read) start(async () => { await setMessageRead(m.id, true); router.refresh(); }); }}>
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2"><span><b className="text-forest">{m.name}</b> <span className="text-sm text-ink/60">&lt;{m.email}&gt;</span>{!m.is_read && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-white">NEW</span>}<br /><span className="text-sm">{m.subject || "(no subject)"}</span></span>
      <span className="text-xs text-ink/50">{new Date(m.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span></summary>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
    <div className="mt-3 flex flex-wrap gap-2"><a className={btn2} href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject || "your message to VEDAGLOW"))}`}>Reply by email</a>
      <button className={btn2} disabled={pending} onClick={() => start(async () => { await setMessageRead(m.id, !m.is_read); router.refresh(); })}>{m.is_read ? "Mark unread" : "Mark read"}</button>
      <button className={btnDanger} disabled={pending} onClick={() => confirm("Delete this message?") && start(async () => { await deleteMessage(m.id); router.refresh(); })}>Delete</button></div></details>);
}

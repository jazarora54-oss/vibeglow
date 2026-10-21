"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReview, replyReview, setReviewStatus } from "@/app/admin/actions";
import { btn, btn2, btnDanger, card, inp } from "./ui";
export interface ReviewRow { id: string; product: string; name: string; email: string; rating: number; body: string; verified: boolean; status: string; reply: string; created_at: string }
export default function ReviewManager({ rows }: { rows: ReviewRow[] }) {
  const [pending, start] = useTransition(); const router = useRouter(); const [reply, setReply] = useState<Record<string, string>>({}); const [msg, setMsg] = useState("");
  const run = (f: () => Promise<{ ok: boolean; message?: string }>) => start(async () => { const r = await f(); setMsg(r.ok ? "" : r.message ?? "Failed"); router.refresh(); });
  if (!rows.length) return <p className={`${card} text-sm text-ink/60`}>Nothing here.</p>;
  return (<div className="space-y-4">{msg && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">⚠ {msg}</p>}
    {rows.map(r => <article key={r.id} className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><b>{r.name}</b> <span className="text-sm text-ink/60">({r.email})</span>{r.verified ? <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Verified purchase</span> : <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-ink/60">Not matched to an order</span>}
        <p className="text-sm text-ink/60">on <b>{r.product}</b> · {new Date(r.created_at).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" })}</p></div>
        <p aria-label={`${r.rating} out of 5 stars`} className="text-xl text-gold">{"★".repeat(r.rating)}<span className="text-gold/30">{"★".repeat(5 - r.rating)}</span></p></div>
      <p className="mt-3 whitespace-pre-line">{r.body}</p>
      <div className="mt-3"><label className="sr-only" htmlFor={`rp${r.id}`}>Reply</label><input id={`rp${r.id}`} className={inp} maxLength={600} placeholder="Public reply from the store (optional)" value={reply[r.id] ?? r.reply} onChange={e => setReply(x => ({ ...x, [r.id]: e.target.value }))} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        {r.status !== "approved" && <button className={btn} disabled={pending} onClick={() => run(async () => { const a = await setReviewStatus(r.id, "approved"); if (a.ok && (reply[r.id] ?? r.reply) !== r.reply) return replyReview(r.id, reply[r.id]); return a; })}>Approve</button>}
        {r.status !== "rejected" && <button className={btn2} disabled={pending} onClick={() => run(() => setReviewStatus(r.id, "rejected"))}>Reject</button>}
        {r.status === "approved" && (reply[r.id] ?? r.reply) !== r.reply && <button className={btn2} disabled={pending} onClick={() => run(() => replyReview(r.id, reply[r.id]))}>Save reply</button>}
        <button className={btnDanger} disabled={pending} onClick={() => confirm("Delete this review for good?") && run(() => deleteReview(r.id))}>Delete</button></div>
    </article>)}</div>);
}

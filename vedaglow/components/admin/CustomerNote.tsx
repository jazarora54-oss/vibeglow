"use client";
import { useState, useTransition } from "react";
import { saveCustomerNote } from "@/app/admin/actions";
import { inp, lbl, btn } from "./ui";
export default function CustomerNote({ email, note, tags }: { email: string; note: string; tags: string[] }) {
  const [n, setN] = useState(note), [t, setT] = useState(tags.join(", ")), [msg, setMsg] = useState(""), [p, go] = useTransition();
  return (<div className="space-y-3"><div><label className={lbl} htmlFor="cn">Private note (customers never see this)</label><textarea id="cn" rows={4} maxLength={4000} value={n} onChange={e => setN(e.target.value)} className={inp} /></div>
    <div><label className={lbl} htmlFor="ct">Tags (comma separated)</label><input id="ct" value={t} onChange={e => setT(e.target.value)} className={inp} placeholder="wholesale, gift-buyer" /></div>
    <div className="flex items-center gap-3"><button className={btn} disabled={p} onClick={() => go(async () => { const r = await saveCustomerNote(email, n, t); setMsg(r.message ?? ""); })}>{p ? "Saving…" : "Save note"}</button>{msg && <span role="status" className="text-sm text-ink/70">{msg}</span>}</div></div>);
}

"use client";
import { useState, useTransition } from "react";
import { retryEmail } from "@/app/admin/actions";
export default function EmailRowActions({ id, failed, html }: { id: number; failed: boolean; html?: string | null }) {
  const [msg, setMsg] = useState(""), [show, setShow] = useState(false), [p, go] = useTransition();
  return (<div className="space-y-2"><div className="flex flex-wrap gap-2">
    {html && <button type="button" className="text-xs font-semibold text-forest underline" onClick={() => setShow(s => !s)}>{show ? "Hide" : "Preview"}</button>}
    {failed && <button type="button" disabled={p} className="text-xs font-semibold text-forest underline" onClick={() => go(async () => setMsg((await retryEmail(id)).message ?? ""))}>{p ? "Retrying…" : "Retry"}</button>}</div>
    {msg && <p role="status" className="text-xs text-ink/70">{msg}</p>}
    {show && html && <iframe title="Email preview" sandbox="" srcDoc={html} className="h-72 w-full min-w-[300px] rounded border border-forest/15 bg-white" />}</div>);
}

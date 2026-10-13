"use client";
import { useState } from "react";
import { unsubscribeOffers } from "@/app/actions/store";
export default function UnsubscribeButton({ token }: { token: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false);
  if (msg?.ok) return <p className="rounded-lg bg-green-50 p-4 text-green-800">{msg.t}</p>;
  return <div><button disabled={busy} onClick={async () => { setBusy(true); try { const r = await unsubscribeOffers(token); setMsg({ ok: r.ok, t: r.message }); } catch { setMsg({ ok: false, t: "Something went wrong. Please try again." }); } setBusy(false); }} className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-forest-500 disabled:opacity-50">{busy ? "…" : "UNSUBSCRIBE"}</button>{msg && <p role="alert" className="mt-3 text-sm text-red-700">{msg.t}</p>}</div>;
}

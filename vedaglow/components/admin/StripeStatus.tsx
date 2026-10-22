"use client";
import { useState, useTransition } from "react";
import { testStripe } from "@/app/admin/actions";
import { btn2 } from "./ui";
export default function StripeStatus() {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition();
  return <div className="flex flex-wrap items-center gap-3"><button className={btn2} disabled={pending} onClick={() => start(async () => { const r = await testStripe(); setMsg({ ok: r.ok, t: r.message ?? "" }); })}>{pending ? "Testing…" : "Test connection"}</button>
    {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>;
}

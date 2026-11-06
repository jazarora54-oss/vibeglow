"use client";
import { useState, useTransition } from "react";
import { sendTestEmail } from "@/app/admin/actions";
import { btn } from "./ui";
export default function TestEmailButton() {
  const [msg, setMsg] = useState(""), [p, go] = useTransition();
  return (<div className="flex flex-wrap items-center gap-3"><button className={btn} disabled={p} onClick={() => go(async () => setMsg((await sendTestEmail()).message ?? ""))}>{p ? "Sending…" : "Send a test email to me"}</button>{msg && <span role="status" className="text-sm text-ink/70">{msg}</span>}</div>);
}

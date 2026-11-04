"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { btn, btn2, card, inp, lbl } from "./ui";
type Factor = { id: string; status: string };
export default function TwoFactorSetup() {
  const [factors, setFactors] = useState<Factor[] | null>(null); const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false);
  const load = async () => { const { data } = await browserClient().auth.mfa.listFactors(); setFactors((data?.totp ?? []).map(f => ({ id: f.id, status: f.status }))); };
  useEffect(() => { void load(); }, []);
  const verified = factors?.find(f => f.status === "verified");
  const start = async () => { setBusy(true); setMsg(null);
    // remove any half-finished setup first
    for (const f of factors ?? []) if (f.status !== "verified") await browserClient().auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await browserClient().auth.mfa.enroll({ factorType: "totp", friendlyName: `VEDAGLOW admin ${new Date().toISOString().slice(0, 10)}` });
    if (error || !data) setMsg({ ok: false, t: "Could not start setup. In Supabase → Authentication → Sign In / Providers → make sure MFA (TOTP) is enabled. " + (error?.message ?? "") });
    else setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setBusy(false); };
  const confirm = async (e: React.FormEvent) => { e.preventDefault(); if (!enroll) return; setBusy(true); setMsg(null);
    const { error } = await browserClient().auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() });
    if (error) setMsg({ ok: false, t: "That code is wrong. Type the newest 6-digit code from the app." });
    else { setMsg({ ok: true, t: "2-step verification is ON. From now on you will be asked for a code when you sign in." }); setEnroll(null); setCode(""); await load(); }
    setBusy(false); };
  const remove = async () => { if (!verified || !confirmRemove()) return; setBusy(true); const { error } = await browserClient().auth.mfa.unenroll({ factorId: verified.id }); setMsg(error ? { ok: false, t: "Could not turn it off: " + error.message } : { ok: true, t: "2-step verification turned off." }); await load(); setBusy(false); };
  const confirmRemove = () => typeof window === "undefined" || window.confirm("Turn OFF 2-step verification? Your account will be less safe.");
  if (!factors) return <p className="text-sm text-ink/60">Loading…</p>;
  return (<div className={`${card} space-y-4`}>
    <p className="text-sm">Status: {verified ? <b className="text-green-700">ON</b> : <b className="text-amber-700">OFF</b>}</p>
    {!verified && !enroll && <button className={btn} disabled={busy} onClick={start}>Set up 2-step verification</button>}
    {enroll && <form onSubmit={confirm} className="space-y-3">
      <p className="text-sm">1. In your authenticator app choose “Add account” and scan this picture:</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enroll.qr} alt="QR code to scan with your authenticator app" width={180} height={180} className="rounded border border-forest/10" />
      <p className="text-xs text-ink/60">Cannot scan? Type this key in the app: <code className="select-all break-all">{enroll.secret}</code></p>
      <div><label className={lbl} htmlFor="c6">2. Type the 6-digit code the app shows</label><input id="c6" className={inp} inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} /></div>
      <button className={btn} disabled={busy || code.length !== 6}>Turn on</button></form>}
    {verified && <button className={btn2} disabled={busy} onClick={remove}>Turn off 2-step verification</button>}
    {msg && <p role="alert" className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.t}</p>}
  </div>);
}

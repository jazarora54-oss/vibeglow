"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
import { btn, inp, lbl } from "./ui";
export default function LoginForm({ notAdmin, needCode = false }: { notAdmin: boolean; needCode?: boolean }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(notAdmin ? "This account is not an admin. Add it to the admins table (see BACKEND-SETUP.md)." : ""); const [busy, setBusy] = useState(false); const [step, setStep] = useState<"pw" | "code">(needCode ? "code" : "pw"); const [code, setCode] = useState(""); const router = useRouter();
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr("");
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) { setErr("Wrong email or password."); setBusy(false); return; }
    const { data: aal } = await browserClient().auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") { setStep("code"); setBusy(false); return; }
    router.push("/admin"); router.refresh(); };
  const verify = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr("");
    const sb = browserClient(); const { data: f } = await sb.auth.mfa.listFactors(); const factor = f?.totp?.find(x => x.status === "verified");
    if (!factor) { setErr("No authenticator is set up for this account. Please sign in again."); setBusy(false); setStep("pw"); return; }
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
    if (error) { setErr("That code is wrong or expired. Try the newest code from your authenticator app."); setBusy(false); return; }
    router.push("/admin"); router.refresh(); };
  if (step === "code") return (
    <form onSubmit={verify} className="mx-auto mt-24 w-full max-w-sm rounded-2xl border border-forest/10 bg-white p-6 shadow-card">
      <h1 className="font-display text-3xl font-semibold text-forest">2-step verification</h1>
      <p className="mt-2 text-sm text-ink/70">Open your authenticator app and type the 6-digit code for VEDAGLOW.</p>
      <div className="mt-5 space-y-4">
        <div><label className={lbl} htmlFor="code">6-digit code</label><input id="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} className={inp} /></div>
        {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</p>}
        <button type="submit" disabled={busy || code.length !== 6} className={`${btn} w-full py-3`}>{busy ? "Checking…" : "Verify"}</button>
      </div>
    </form>
  );
  return (
    <form onSubmit={go} className="mx-auto mt-24 w-full max-w-sm rounded-2xl border border-forest/10 bg-white p-6 shadow-card">
      <h1 className="font-display text-3xl font-semibold text-forest">Admin sign in</h1>
      <div className="mt-5 space-y-4">
        <div><label className={lbl} htmlFor="em">Email</label><input id="em" type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
        <div><label className={lbl} htmlFor="pw">Password</label><input id="pw" type="password" required autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} className={inp} /></div>
        {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</p>}
        <button type="submit" disabled={busy} className={`${btn} w-full py-3`}>{busy ? "Signing in…" : "Sign in"}</button>
      </div>
    </form>
  );
}

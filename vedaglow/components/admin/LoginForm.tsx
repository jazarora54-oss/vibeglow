"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
import { btn, inp, lbl } from "./ui";
export default function LoginForm({ notAdmin }: { notAdmin: boolean }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(notAdmin ? "This account is not an admin. Add it to the admins table (see BACKEND-SETUP.md)." : ""); const [busy, setBusy] = useState(false); const router = useRouter();
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr("");
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) { setErr("Wrong email or password."); setBusy(false); return; }
    router.push("/admin"); router.refresh(); };
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

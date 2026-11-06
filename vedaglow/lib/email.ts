import { siteUrl } from "@/lib/site";
/** Email sending through Resend (https://resend.com). Does nothing (and never breaks an order) until RESEND_API_KEY is set. */
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
const from = () => process.env.EMAIL_FROM || "VEDAGLOW <onboarding@resend.dev>";
export interface Mail { to: string; subject: string; html: string; text?: string; /** what kind of email, for the admin log */ kind?: string }
type R = { ok: boolean; error?: string };
async function call(path: string, body: unknown): Promise<R> {
  const key = process.env.RESEND_API_KEY; if (!key) return { ok: false, error: "Email is not set up yet." };
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(`${process.env.RESEND_API_URL || "https://api.resend.com"}${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal, cache: "no-store" });
    if (res.ok) return { ok: true };
    let msg = `Email service error (${res.status}).`; try { const j = await res.json(); if (j?.message) msg = String(j.message); } catch { /* ignore */ }
    console.error("email failed:", msg); return { ok: false, error: msg };
  } catch (e) { console.error("email failed:", e); return { ok: false, error: "Could not reach the email service." }; } finally { clearTimeout(t); }
}
/** Promotional email is OFF unless MARKETING_EMAILS_ENABLED=true is set on purpose (needs a verified sending domain + consent). Order emails are not affected. */
export const marketingEnabled = () => process.env.MARKETING_EMAILS_ENABLED === "true";
/** Best effort: writes one row to email_log. Never throws, never stops an email. */
async function logMail(ms: Mail[], r: R) {
  try { const { serviceClient } = await import("@/lib/supabase/server"); const db = serviceClient(); if (!db) return;
    await db.from("email_log").insert(ms.map(m => ({ kind: (m.kind ?? "other").slice(0, 40), to_email: m.to.slice(0, 200), subject: m.subject.slice(0, 300), ok: r.ok, error: r.ok ? null : (r.error ?? "").slice(0, 300) })));
  } catch { /* logging must never break sending */ }
}
export const sendEmail = async (m: Mail) => { const r = await call("/emails", { from: from(), to: [m.to], subject: m.subject, html: m.html, text: m.text }); await logMail([m], r); return r; };
/** Up to 100 different emails in one request. */
export const sendBatch = async (ms: Mail[]) => { const b = ms.slice(0, 100); const r = await call("/emails/batch", b.map(m => ({ from: from(), to: [m.to], subject: m.subject, html: m.html, text: m.text }))); await logMail(b, r); return r; };
export const baseUrl = siteUrl;

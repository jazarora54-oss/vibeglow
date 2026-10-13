import { siteUrl } from "@/lib/site";
/** Email sending through Resend (https://resend.com). Does nothing (and never breaks an order) until RESEND_API_KEY is set. */
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
const from = () => process.env.EMAIL_FROM || "VEDAGLOW <onboarding@resend.dev>";
export interface Mail { to: string; subject: string; html: string; text?: string }
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
export const sendEmail = (m: Mail) => call("/emails", { from: from(), to: [m.to], subject: m.subject, html: m.html, text: m.text });
/** Up to 100 different emails in one request. */
export const sendBatch = (ms: Mail[]) => call("/emails/batch", ms.slice(0, 100).map(m => ({ from: from(), to: [m.to], subject: m.subject, html: m.html, text: m.text })));
export const baseUrl = siteUrl;

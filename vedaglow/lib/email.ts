import { siteUrl } from "@/lib/site";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/data/defaults";
/**
 * Business email sending. Two ways, chosen by what is set in Netlify (secrets never live in the database or the browser):
 *  - Gmail / SMTP: GMAIL_APP_PASSWORD (a Google "App password", NOT your normal password)  [+ optional SMTP_PASSWORD for other SMTP]
 *  - Resend:       RESEND_API_KEY
 * EMAIL_PROVIDER=gmail|resend forces one. Nothing is sent (and no order ever fails) until one is set.
 */
export type Provider = "gmail" | "resend" | "none";
export function emailProvider(env: Record<string, string | undefined> = process.env): Provider {
  const want = (env.EMAIL_PROVIDER || "").toLowerCase();
  const smtp = Boolean((env.GMAIL_APP_PASSWORD || env.SMTP_PASSWORD || "").trim()), res = Boolean((env.RESEND_API_KEY || "").trim());
  if (want === "gmail") return smtp ? "gmail" : "none"; if (want === "resend") return res ? "resend" : "none";
  return smtp ? "gmail" : res ? "resend" : "none";
}
export const emailConfigured = () => emailProvider() !== "none";
/** Promotional email is OFF unless MARKETING_EMAILS_ENABLED=true is set on purpose (needs a verified sending domain + consent). Order emails are not affected. */
export const marketingEnabled = () => process.env.MARKETING_EMAILS_ENABLED === "true";
export const baseUrl = siteUrl;

export interface Attachment { filename: string; content: Buffer; contentType?: string }
export interface Mail { to: string; subject: string; html: string; text?: string; /** what kind of email, for the admin log */ kind?: string; /** one successful send per key, e.g. "order_confirmation:VDG-1" */ dedupeKey?: string; orderId?: string; replyTo?: string; attachments?: Attachment[] }
export type R = { ok: boolean; error?: string; skipped?: boolean; logId?: number };

/** Who the mail comes from. For Gmail the "from" address must be the Gmail account itself (Gmail rewrites anything else). */
export interface Identity { fromEmail: string; fromName: string; replyTo?: string; smtp: { host: string; port: number; secure: boolean; user: string } }
const okEmail = (v: unknown) => (typeof v === "string" && /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/.test(v.trim()) ? v.trim() : "");
const clean = (v: unknown, n = 80) => String(v ?? "").replace(/[\r\n<>"]/g, " ").trim().slice(0, n);
export function identityOf(s: Partial<SiteSettings>, env: Record<string, string | undefined> = process.env): Identity {
  const user = okEmail(env.GMAIL_USER) || okEmail(s.smtp_user) || okEmail(s.support_email) || okEmail(s.email);
  const provider = emailProvider(env); const resendFrom = okEmail((env.EMAIL_FROM || "").replace(/^.*<([^>]+)>.*$/, "$1")) || "onboarding@resend.dev";
  const port = Math.floor(Number(env.SMTP_PORT || s.smtp_port)); const host = clean(env.SMTP_HOST || s.smtp_host || DEFAULT_SETTINGS.smtp_host, 100) || "smtp.gmail.com";
  return { fromEmail: provider === "gmail" ? user : resendFrom, fromName: clean(s.sender_name || s.store_name || "VedaGlow", 80), replyTo: okEmail(s.reply_to) || okEmail(s.support_email) || okEmail(s.email) || undefined,
    smtp: { host, port: Number.isFinite(port) && port > 0 && port < 65536 ? port : 465, secure: env.SMTP_SECURE ? env.SMTP_SECURE !== "false" : s.smtp_secure !== false, user } };
}
async function identity(): Promise<Identity> { try { const { getSiteSettings } = await import("@/lib/data/site"); return identityOf(await getSiteSettings()); } catch { return identityOf({}); } }

async function viaSmtp(id: Identity, m: Mail): Promise<{ ok: boolean; error?: string }> {
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || "").replace(/\s+/g, ""); if (!pass || !id.smtp.user) return { ok: false, error: "Gmail is not set up (missing App password or sender email)." };
  try {
    const nm = await import("nodemailer"); const tr = nm.createTransport({ host: id.smtp.host, port: id.smtp.port, secure: id.smtp.secure, auth: { user: id.smtp.user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
    const info = await tr.sendMail({ from: { name: id.fromName, address: id.fromEmail }, to: m.to, replyTo: m.replyTo || id.replyTo, subject: m.subject, html: m.html, text: m.text, attachments: m.attachments?.map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType })) });
    return info.accepted?.length ? { ok: true } : { ok: false, error: "The mail server did not accept the recipient." };
  } catch (e) { return { ok: false, error: smtpError(e) }; }
}
/** Plain-language reason, never the secret. */
export function smtpError(e: unknown): string {
  const c = (e as { code?: string; responseCode?: number; message?: string }) ?? {}; const msg = String(c.message ?? "");
  if (c.code === "EAUTH" || c.responseCode === 535) return "Gmail refused the login. Check the App password (needs 2-Step Verification ON) and that the sender email is the Gmail account.";
  if (c.code === "ETIMEDOUT" || c.code === "ESOCKET" || c.code === "ECONNECTION" || c.code === "EDNS") return "Could not reach the mail server (timeout/connection). Try again.";
  if (c.responseCode === 550 || c.responseCode === 553) return "The recipient address was rejected by the mail server.";
  if (c.responseCode === 421 || c.responseCode === 452 || /rate|limit|quota/i.test(msg)) return "Gmail sending limit reached. Wait and retry later.";
  return "The mail server returned an error.";
}
async function viaResend(id: Identity, m: Mail): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY; if (!key) return { ok: false, error: "Email is not set up yet." };
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
  try {
    const res = await fetch(`${process.env.RESEND_API_URL || "https://api.resend.com"}/emails`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, signal: ctl.signal,
      body: JSON.stringify({ from: process.env.EMAIL_FROM || `${id.fromName} <${id.fromEmail}>`, to: [m.to], reply_to: m.replyTo || id.replyTo, subject: m.subject, html: m.html, text: m.text, attachments: m.attachments?.map(a => ({ filename: a.filename, content: a.content.toString("base64") })) }) });
    if (res.ok) return { ok: true };
    let msg = `Email service error (${res.status}).`; try { const j = await res.json(); if (j?.message) msg = String(j.message).slice(0, 200); } catch { /* ignore */ }
    return { ok: false, error: msg };
  } catch { return { ok: false, error: "Could not reach the email service." }; } finally { clearTimeout(t); }
}
const GMAIL_DAY = () => { const n = Math.floor(Number(process.env.GMAIL_DAILY_LIMIT)); return Number.isFinite(n) && n > 0 ? n : 400; }; // Gmail allows about 500/day for a normal account

type Db = ReturnType<typeof import("@/lib/supabase/server").serviceClient>;
async function db(): Promise<Db> { try { const { serviceClient } = await import("@/lib/supabase/server"); return serviceClient(); } catch { return null; } }
async function transport(m: Mail): Promise<{ ok: boolean; error?: string }> {
  const p = emailProvider(); if (p === "none") return { ok: false, error: "Email is not set up yet." };
  const id = await identity(); return p === "gmail" ? viaSmtp(id, m) : viaResend(id, m);
}
/** Sends one email, records it in the log (honestly: failed stays failed) and never sends the same dedupeKey twice. */
export async function sendEmail(m: Mail): Promise<R> {
  const d = await db(); const to = String(m.to ?? "").trim();
  if (!okEmail(to)) return { ok: false, error: "Invalid recipient address." };
  if (d && m.dedupeKey) { try { const { data } = await d.from("email_log").select("id").eq("dedupe_key", m.dedupeKey).eq("ok", true).limit(1); if (data?.length) return { ok: true, skipped: true, logId: data[0].id }; } catch { /* log table missing: send anyway */ } }
  let r: { ok: boolean; error?: string };
  if (emailProvider() === "gmail" && d) { try { const since = new Date(); since.setUTCHours(0, 0, 0, 0); const { count } = await d.from("email_log").select("id", { count: "exact", head: true }).eq("ok", true).gte("created_at", since.toISOString()); if ((count ?? 0) >= GMAIL_DAY()) r = { ok: false, error: `Daily Gmail limit (${GMAIL_DAY()}) reached. It can be retried tomorrow from Admin → Emails.` }; else r = await transport({ ...m, to }); } catch { r = await transport({ ...m, to }); } }
  else r = await transport({ ...m, to });
  if (!r.ok) console.error("email failed:", r.error);
  let logId: number | undefined;
  if (d) { try { const { data } = await d.from("email_log").insert({ kind: (m.kind ?? "other").slice(0, 40), to_email: to.slice(0, 200), subject: m.subject.slice(0, 300), ok: r.ok, error: r.ok ? null : (r.error ?? "").slice(0, 300), html: m.html.slice(0, 200000), text_body: (m.text ?? "").slice(0, 50000), dedupe_key: m.dedupeKey ?? null, order_id: m.orderId ?? null, has_attachment: Boolean(m.attachments?.length), reply_to: m.replyTo ?? null }).select("id").maybeSingle(); logId = data?.id; } catch { /* logging must never break sending */ } }
  return { ...r, logId };
}
/** Many different emails (promotional send). Same safety as sendEmail, one by one. */
export async function sendBatch(ms: Mail[]): Promise<R> {
  let bad = 0, last = ""; for (const m of ms.slice(0, 100)) { const r = await sendEmail(m); if (!r.ok) { bad++; last = r.error ?? ""; } }
  return bad === 0 ? { ok: true } : { ok: false, error: `${bad} of ${Math.min(ms.length, 100)} failed. ${last}` };
}
/** Admin retry of a FAILED email from the log (uses the stored copy; invoice PDFs must be re-sent from the order page). */
export async function retryLogged(id: number): Promise<R> {
  const d = await db(); if (!d) return { ok: false, error: "Database not available." };
  const { data: row } = await d.from("email_log").select("*").eq("id", id).maybeSingle();
  if (!row) return { ok: false, error: "That email was not found." }; if (row.ok) return { ok: true, skipped: true };
  if (!row.html) return { ok: false, error: "The original text was not stored, so it cannot be resent." }; if (row.has_attachment) return { ok: false, error: "This email had a PDF attached. Resend it from the order page (Email invoice)." };
  if (row.dedupe_key) { const { data: done } = await d.from("email_log").select("id").eq("dedupe_key", row.dedupe_key).eq("ok", true).limit(1); if (done?.length) return { ok: true, skipped: true }; }
  const r = await transport({ to: row.to_email, subject: row.subject, html: row.html, text: row.text_body ?? undefined, replyTo: row.reply_to ?? undefined });
  await d.from("email_log").update({ ok: r.ok, error: r.ok ? null : (r.error ?? "").slice(0, 300), attempts: (row.attempts ?? 1) + 1, updated_at: new Date().toISOString() }).eq("id", id);
  return r;
}
/** Settings page "Test connection": logs in to the mail server without sending anything. */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  const p = emailProvider(); if (p === "none") return { ok: false, message: "No email provider is set. Add GMAIL_APP_PASSWORD (or RESEND_API_KEY) in Netlify and redeploy." };
  if (p === "resend") return { ok: true, message: "Resend key is present. Use “Send a test email to me” to prove delivery." };
  const id = await identity(); const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || "").replace(/\s+/g, ""); if (!id.smtp.user) return { ok: false, message: "Set the sender Gmail address first (SMTP user or Support email)." };
  try { const nm = await import("nodemailer"); const tr = nm.createTransport({ host: id.smtp.host, port: id.smtp.port, secure: id.smtp.secure, auth: { user: id.smtp.user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000 }); await tr.verify(); return { ok: true, message: `Connected to ${id.smtp.host}:${id.smtp.port} as ${id.smtp.user}.` }; }
  catch (e) { return { ok: false, message: smtpError(e) }; }
}

import { getSiteSettings } from "@/lib/data/site";
import { emailProvider } from "@/lib/email";
import BusinessEmailForm from "@/components/admin/BusinessEmailForm";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSiteSettings(); const hasSecret = Boolean((process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || "").trim());
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Business Email</h1>
    <BusinessEmailForm provider={emailProvider()} hasSecret={hasSecret} initial={{ store_name: s.store_name, sender_name: s.sender_name || "VedaGlow Customer Support", email: s.email, reply_to: s.reply_to || "", support_email: s.support_email || "", order_notify_email: s.order_notify_email || "", invoice_email: s.invoice_email || "", refund_notify_email: s.refund_notify_email || "", smtp_host: s.smtp_host || "smtp.gmail.com", smtp_port: s.smtp_port || 465, smtp_secure: s.smtp_secure !== false, smtp_user: s.smtp_user || "", auto_email_invoice: Boolean(s.auto_email_invoice) }} /></div>);
}

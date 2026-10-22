import StripeStatus from "@/components/admin/StripeStatus";
import { card } from "@/components/admin/ui";
import { stripeMode, webhookSecret } from "@/lib/payments/stripe";
import { siteUrl } from "@/lib/site";
import { emailConfigured } from "@/lib/email";
export const dynamic = "force-dynamic";
const Row = ({ ok, label, hint }: { ok: boolean; label: string; hint: string }) => <li className="flex gap-3 py-2 text-sm"><span className={`mt-0.5 font-bold ${ok ? "text-green-700" : "text-amber-700"}`}>{ok ? "✓" : "○"}</span><span><b>{label}</b><br /><span className="text-ink/60">{hint}</span></span></li>;
export default function Page() {
  const mode = stripeMode(), hook = Boolean(webhookSecret()), url = `${siteUrl()}/api/stripe/webhook`;
  return <div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Payments</h1>
    <p className="text-sm text-ink/60">Customers pay by card, Apple Pay or Google Pay on Stripe&apos;s secure page. Card details never touch this website. Until Stripe is connected, checkout stays in demo mode and takes no money.</p>
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Status</h2>
      <ul className="divide-y divide-forest/10">
        <Row ok={mode !== "off"} label={mode === "off" ? "Stripe key: not set" : mode === "live" ? "Stripe key: LIVE (real money)" : "Stripe key: TEST mode (no real money)"} hint="Netlify → Site configuration → Environment variables → STRIPE_SECRET_KEY" />
        <Row ok={hook} label={hook ? "Webhook secret: set" : "Webhook secret: not set"} hint="STRIPE_WEBHOOK_SECRET. Without it orders are never marked as paid, so do not go live without it." />
        <Row ok={emailConfigured()} label={emailConfigured() ? "Order emails: on" : "Order emails: off"} hint="Customers get their confirmation email after payment succeeds (needs RESEND_API_KEY)." /></ul>
      <div className="mt-3"><StripeStatus /></div></section>
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Set up, step by step</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>Create a Stripe account at stripe.com and finish the business details. Start in <b>Test mode</b>.</li>
        <li>Stripe → Developers → API keys → copy the <b>Secret key</b> (sk_test_…). Add it in Netlify as <code>STRIPE_SECRET_KEY</code>.</li>
        <li>Stripe → Developers → Webhooks → Add endpoint. Address: <code className="break-all rounded bg-cream-dark px-1">{url}</code></li>
        <li>Choose these events: <code>checkout.session.completed</code>, <code>checkout.session.expired</code>, <code>charge.refunded</code>.</li>
        <li>Copy the endpoint&apos;s <b>Signing secret</b> (whsec_…) and add it in Netlify as <code>STRIPE_WEBHOOK_SECRET</code>.</li>
        <li>Netlify → Deploys → Trigger deploy (so the new keys load). Then press Test connection above.</li>
        <li>Place a test order with Stripe&apos;s test card <b>4242 4242 4242 4242</b> (any future date, any 3 digits). It should show as Paid here in Orders.</li>
        <li>When happy: switch Stripe to Live, replace both keys with the live ones (sk_live_…, new whsec_…) and deploy again.</li></ol></section>
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">How it works</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink/70"><li>The order is saved and its stock is held when the customer goes to pay.</li>
        <li>Paid: the order becomes <b>Paid / Processing</b> and the confirmation email is sent.</li>
        <li>Not paid within about 30 minutes: the order is cancelled and the stock goes back by itself.</li>
        <li>Refund: open the order and press Refund (full amount). Refunds made inside Stripe are noticed automatically.</li>
        <li>PayPal is not included. Apple Pay and Google Pay work through Stripe once switched on in your Stripe settings.</li></ul></section></div>;
}

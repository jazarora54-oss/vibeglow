import { Lock } from "lucide-react";
/** Shown when card payment is switched on. No card field here: the customer pays on Stripe's own secure page. */
export default function StripePanel() {
  return <section className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><h2 className="mb-1 font-display text-2xl font-semibold text-forest">PAYMENT</h2>
    <p className="flex items-center gap-2 text-sm text-ink/70"><Lock size={14} />Pay securely by card, Apple Pay or Google Pay on the next page.</p>
    <p className="mt-3 rounded-lg bg-cream-dark p-3 text-xs text-ink/70">After you press the button you are taken to Stripe, our payment provider. Your card details go directly to Stripe and are never seen or stored on this website.</p></section>;
}

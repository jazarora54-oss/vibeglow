import { CreditCard, Lock } from "lucide-react";
export const PAYMENT_OPTIONS = ["Credit / Debit Card", "PayPal", "Apple Pay", "Google Pay"];
/** UI only. No card data is collected or stored; a secure provider is connected in a later step. */
export default function PaymentPlaceholder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <fieldset className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><legend className="sr-only">Payment method</legend>
    <h2 className="mb-1 font-display text-2xl font-semibold text-forest">PAYMENT</h2>
    <p className="mb-4 flex items-center gap-2 text-sm text-ink/70"><Lock size={14} />Payment will be securely processed at the next stage.</p>
    <div className="grid gap-3 sm:grid-cols-2">{PAYMENT_OPTIONS.map(o => { const on = value === o; return <label key={o} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-sm font-medium ${on ? "border-forest bg-forest-100" : "border-forest/15"}`}>
      <input type="radio" name="payment" checked={on} onChange={() => onChange(o)} className="h-4 w-4 accent-forest" /><CreditCard size={16} className="text-gold-dark" />{o}</label>; })}</div>
    <p className="mt-3 rounded-lg bg-cream-dark p-3 text-xs text-ink/70">Payment integration coming in the next payment step. These options are placeholders: nothing is charged and no card details are collected.</p></fieldset>;
}

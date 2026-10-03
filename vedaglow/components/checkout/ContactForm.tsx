import type { CustomerInformation } from "@/types";
import type { Errors } from "@/lib/checkout/validation";
import Field from "./Field";
export default function ContactForm({ value, onChange, errors }: { value: CustomerInformation; onChange: (v: CustomerInformation) => void; errors: Errors }) {
  return <fieldset className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><legend className="sr-only">Contact information</legend>
    <h2 className="mb-4 font-display text-2xl font-semibold text-forest">CONTACT INFORMATION</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="ct-email" label="Email Address" type="email" autoComplete="email" value={value.email} onChange={e => onChange({ ...value, email: e.target.value })} error={errors.email} />
      <Field id="ct-phone" label="Phone Number" type="tel" autoComplete="tel" value={value.phone} onChange={e => onChange({ ...value, phone: e.target.value })} error={errors.phone} /></div></fieldset>;
}

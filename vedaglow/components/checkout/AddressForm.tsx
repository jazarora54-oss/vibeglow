import type { Address } from "@/types";
import { COUNTRIES, type Errors } from "@/lib/checkout/validation";
import Field from "./Field";
import { US_STATES, stateCode } from "@/lib/shipping/rules";
/** Reusable for shipping and billing. prefix keeps element ids unique. */
export default function AddressForm({ prefix, value, onChange, errors }: { prefix: string; value: Address; onChange: (a: Address) => void; errors: Errors }) {
  const set = (k: keyof Address) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const id = (k: string) => `${prefix}-${k}`;
  return <div className="grid gap-4 sm:grid-cols-2">
    <Field id={id("first")} label="First Name" autoComplete="given-name" value={value.first_name} onChange={set("first_name")} error={errors.first_name} />
    <Field id={id("last")} label="Last Name" autoComplete="family-name" value={value.last_name} onChange={set("last_name")} error={errors.last_name} />
    <div className="sm:col-span-2"><Field id={id("addr")} label="Address" autoComplete="address-line1" value={value.address1} onChange={set("address1")} error={errors.address1} /></div>
    <div className="sm:col-span-2"><Field id={id("addr2")} label="Apartment / Suite / Unit" optional autoComplete="address-line2" value={value.address2 ?? ""} onChange={set("address2")} /></div>
    <Field id={id("city")} label="City" autoComplete="address-level2" value={value.city} onChange={set("city")} error={errors.city} />
    <div className="min-w-0"><label htmlFor={id("state")} className="mb-1 block text-sm font-medium">State</label>
      <select id={id("state")} autoComplete="address-level1" value={stateCode(value.state)} onChange={set("state")} aria-invalid={!!errors.state} className={`w-full rounded-lg border bg-white px-3 py-3 text-sm ${errors.state ? "border-red-600" : "border-forest/20"}`}><option value="">Select state</option>{Object.entries(US_STATES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
      {errors.state && <p className="mt-1 text-xs font-medium text-red-700">⚠ {errors.state}</p>}</div>
    <Field id={id("zip")} label="ZIP Code" autoComplete="postal-code" inputMode="text" value={value.zip} onChange={set("zip")} error={errors.zip} />
    <div className="min-w-0"><label htmlFor={id("country")} className="mb-1 block text-sm font-medium">Country</label>
      <select id={id("country")} autoComplete="country-name" value={value.country} onChange={set("country")} aria-invalid={!!errors.country} className="w-full rounded-lg border border-forest/20 bg-white px-3 py-3 text-sm">{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select>
      {errors.country && <p className="mt-1 text-xs font-medium text-red-700">⚠ {errors.country}</p>}</div>
  </div>;
}

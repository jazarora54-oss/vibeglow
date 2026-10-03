import type { InputHTMLAttributes } from "react";
export default function Field({ id, label, error, optional, ...rest }: { id: string; label: string; error?: string; optional?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return <div className="min-w-0"><label htmlFor={id} className="mb-1 block text-sm font-medium">{label}{optional && <span className="font-normal text-ink/50"> (optional)</span>}</label>
    <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`w-full rounded-lg border bg-white px-3 py-3 text-sm ${error ? "border-red-600" : "border-forest/20"}`} {...rest} />
    {error && <p id={`${id}-err`} className="mt-1 text-xs font-medium text-red-700">⚠ {error}</p>}</div>;
}

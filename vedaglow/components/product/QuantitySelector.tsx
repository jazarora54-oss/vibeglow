import { Minus, Plus } from "lucide-react";
export default function QuantitySelector({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const off = max <= 0; const btn = "grid h-11 w-11 place-items-center text-forest hover:bg-forest-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="inline-flex items-center rounded-lg border border-forest/20 bg-white" role="group" aria-label="Quantity">
      <button type="button" className={btn} disabled={off || value <= 1} onClick={() => onChange(value - 1)} aria-label="Decrease quantity"><Minus size={16} /></button>
      <span className="w-12 text-center font-semibold" aria-live="polite">{off ? 0 : value}</span>
      <button type="button" className={btn} disabled={off || value >= max} onClick={() => onChange(value + 1)} aria-label="Increase quantity"><Plus size={16} /></button>
    </div>
  );
}

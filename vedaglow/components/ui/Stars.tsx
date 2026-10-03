import { Star } from "lucide-react";
export default function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${value} out of 5 stars`}>
      <div className="flex">{[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} className={i <= Math.round(value) ? "fill-gold text-gold" : "text-gold/40"} />))}</div>
      {count !== undefined && <span className="text-xs text-ink/60">({count})</span>}
    </div>
  );
}

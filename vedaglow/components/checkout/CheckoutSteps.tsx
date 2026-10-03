const STEPS = ["CART", "INFORMATION", "SHIPPING", "PAYMENT", "CONFIRMATION"];
export default function CheckoutSteps({ current }: { current: number }) {
  return <nav aria-label="Checkout progress"><ol className="flex items-center justify-between gap-1 text-[10px] font-semibold tracking-wide sm:text-xs">
    {STEPS.map((s, i) => { const n = i + 1; const done = n < current; const on = n === current;
      return <li key={s} aria-current={on ? "step" : undefined} className={`flex flex-1 flex-col items-center gap-1 text-center ${on ? "text-forest" : done ? "text-forest-500" : "text-ink/40"}`}>
        <span className={`grid h-7 w-7 place-items-center rounded-full border-2 text-xs ${on ? "border-forest bg-forest text-white" : done ? "border-forest-500 bg-forest-100" : "border-ink/20"}`}>{done ? "✓" : n}</span>
        <span className="hidden sm:block">{s}</span><span className="sr-only sm:hidden">{s}{on ? " (current)" : done ? " (done)" : ""}</span></li>; })}
  </ol></nav>;
}

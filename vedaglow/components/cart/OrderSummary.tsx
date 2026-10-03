import type { OrderSummary as Summary } from "@/types";
import { TAX_RATE } from "@/lib/cart/config";
import { money } from "@/lib/format";
const Row = ({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) => <div className={`flex justify-between gap-4 ${strong ? "text-lg font-bold text-forest" : "text-sm"}`}><dt>{label}</dt><dd className={tone}>{value}</dd></div>;
/** context="cart": tax line says "calculated at checkout" while TAX_RATE is 0. At checkout/confirmation a zero tax line is hidden. */
export default function OrderSummary({ summary, context = "cart", shippingNote = true }: { summary: Summary; context?: "cart" | "checkout" | "confirmation"; shippingNote?: boolean }) {
  return (
    <dl className="space-y-3">
      <Row label="Subtotal" value={money(summary.subtotal)} />
      {summary.discount > 0 && <Row label={`Discount${summary.coupon_code ? ` (${summary.coupon_code})` : ""}`} value={`-${money(summary.discount)}`} tone="font-semibold text-forest-500" />}
      <Row label={shippingNote ? "Shipping (estimated)" : "Shipping"} value={summary.shipping === 0 ? "FREE" : money(summary.shipping)} tone={summary.shipping === 0 ? "font-semibold text-forest-500" : ""} />
      {TAX_RATE > 0 ? <Row label="Tax (estimated)" value={money(summary.tax)} /> : context === "cart" && <Row label="Tax" value="Calculated at checkout" tone="text-ink/60" />}
      <div className="border-t border-forest/15 pt-3"><Row label="TOTAL" value={money(summary.total)} strong /></div>
    </dl>
  );
}

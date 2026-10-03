import type { Review } from "@/types";
// DEMO DATA: sample reviews for layout only - not real customers. Replace with Supabase `reviews` queries later.
const DEMO: Omit<Review, "product_id">[] = [
  { id: "demo-1", customer_id: "demo", customer_name: "Sarah M.", verified: true, rating: 5, body: "Very nice product. The packaging was good and delivery was quick.", created_at: "2026-09-14", is_demo: true },
  { id: "demo-2", customer_id: "demo", customer_name: "Daniel R.", verified: true, rating: 4, body: "Pleasant texture and easy to use every day. Would buy again.", created_at: "2026-09-02", is_demo: true },
  { id: "demo-3", customer_id: "demo", customer_name: "Priya K.", verified: true, rating: 5, body: "Lovely scent and a great size for the price.", created_at: "2026-08-21", is_demo: true },
];
export async function getProductReviews(productId: string): Promise<Review[]> { return DEMO.map(r => ({ ...r, product_id: productId })); }
const SHARE = [0.6, 0.25, 0.09, 0.04, 0.02]; // demo distribution for 5..1 stars
export function getRatingBreakdown(total: number) {
  const counts = SHARE.map(s => Math.round(total * s)); counts[0] += total - counts.reduce((a, b) => a + b, 0);
  return counts.map((count, i) => ({ stars: 5 - i, count, pct: total ? Math.round((count / total) * 100) : 0 }));
}

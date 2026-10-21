import type { Review } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicClient } from "@/lib/supabase/public";
/** Approved, genuine customer reviews of one product (admin -> Reviews decides what is shown). Empty until real customers write some. */
export async function getProductReviews(productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await publicClient().rpc("get_reviews", { p_product_id: productId });
    if (error || !Array.isArray(data)) return [];
    return data.map((r: any): Review => ({ id: String(r.id), product_id: productId, customer_id: "", customer_name: r.customer_name, rating: Number(r.rating), body: r.body, verified: Boolean(r.verified), created_at: r.created_at, admin_reply: r.admin_reply ?? undefined }));
  } catch { return []; }
}
/** Real star counts from the reviews shown (5 stars first). */
export function getRatingBreakdown(reviews: Review[]) {
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map(stars => { const count = reviews.filter(r => r.rating === stars).length; return { stars, count, pct: total ? Math.round((count / total) * 100) : 0 }; });
}

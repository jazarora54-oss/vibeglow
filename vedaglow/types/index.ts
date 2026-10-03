export type CategorySlug = "skin-care" | "hair-care" | "body-care" | "health-wellness" | "oral-care";
export interface Category { id: string; slug: string; name: string; image_url?: string; href: string; tone: string }
export type ProductVisualKind = "bottle" | "jar" | "tube" | "dropper" | "pump";
export interface ProductVariant { id: string; sku: string; label: string; size?: string; color?: string; price: number; compare_at_price?: number; stock: number }
export interface Product {
  id: string; slug: string; name: string; brand?: string; short_description: string;
  // Optional detail content (all editable later / from the database)
  description?: string; ingredients?: string; benefits?: string; how_to_use?: string; size_quantity?: string;
  shipping_info?: string; return_info?: string; suitable_for?: string; sku?: string; product_type?: string; size?: string;
  category: CategorySlug;
  price: number; compare_at_price?: number; rating: number; review_count: number;
  images: string[]; visual: { kind: ProductVisualKind; label: string; color: string };
  tags: ("best-seller" | "new" | "sale" | "featured")[]; variants?: ProductVariant[]; stock: number; created_at: string;
}
export interface CartItem { product_id: string; variant_id?: string; quantity: number; unit_price: number; slug?: string; name?: string; image?: string; variant_label?: string; sku?: string; max_stock?: number; visual?: Product["visual"] }
export interface Customer { id: string; email: string; first_name?: string; last_name?: string }
export interface Review { id: string; product_id: string; customer_id: string; customer_name?: string; rating: number; body: string; verified?: boolean; created_at?: string; is_demo?: boolean }
export interface Coupon { code: string; percent_off?: number; amount_off?: number; min_subtotal?: number }
export interface ChatMessage { id: string; role: "user" | "assistant"; content: string }

// ---- STEP 4: cart / checkout / temporary order ----
export interface ShippingMethod { id: string; name: string; description: string; eta: string; price: number; free_over?: number }
export interface CustomerInformation { email: string; phone: string }
export interface Address { first_name: string; last_name: string; address1: string; address2?: string; city: string; state: string; zip: string; country: string }
export interface CheckoutData { contact: CustomerInformation; shipping_address: Address; billing_address: Address; billing_same_as_shipping: boolean; shipping_method_id: string; payment_method: string }
export interface OrderSummary { item_count: number; subtotal: number; discount: number; shipping: number; tax: number; total: number; coupon_code?: string }
export interface OrderItem { product_id: string; variant_id?: string; name: string; slug?: string; variant_label?: string; sku?: string; image?: string; visual?: Product["visual"]; quantity: number; unit_price: number; line_total: number }
export interface TemporaryOrder { id: string; created_at: string; status: "pending-payment"; items: OrderItem[]; summary: OrderSummary; checkout: CheckoutData; shipping_method: ShippingMethod; estimated_delivery: string }

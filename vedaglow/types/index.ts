export type CategorySlug = "skin-care" | "hair-care" | "body-care" | "health-wellness" | "oral-care";
export interface Category { id: string; slug: string; name: string; image_url?: string; href: string; tone: string }
export type ShipMode = "free" | "flat" | "calculated";
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
  // SEO + eBay-style details + ranking (all optional)
  seo_title?: string; seo_description?: string; seo_keywords?: string; specifics?: { name: string; value: string }[]; sort_priority?: number;
  gtin?: string; mpn?: string; condition?: string; weight_g?: number; dimensions?: string; country_of_origin?: string; shelf_life?: string;
  // Shipping (per listing, like eBay)
  shipping_mode?: ShipMode; shipping_flat_price?: number; shipping_extra_price?: number; handling_days?: number; pkg_length_in?: number; pkg_width_in?: number; pkg_height_in?: number;
}
export interface CartItem { product_id: string; variant_id?: string; quantity: number; unit_price: number; slug?: string; name?: string; image?: string; variant_label?: string; sku?: string; max_stock?: number; visual?: Product["visual"];
  // shipping snapshot taken when added to the cart (the server re-checks everything at checkout)
  ship_mode?: ShipMode; ship_flat?: number; ship_extra?: number; weight_g?: number; pkg?: [number, number, number]; handling_days?: number }
export interface Customer { id: string; email: string; first_name?: string; last_name?: string }
export interface Review { id: string; product_id: string; customer_id: string; customer_name?: string; rating: number; body: string; verified?: boolean; created_at?: string; is_demo?: boolean }
export interface Coupon { code: string; percent_off?: number; amount_off?: number; min_subtotal?: number }
export interface ChatMessage { id: string; role: "user" | "assistant"; content: string }

// ---- STEP 4: cart / checkout / temporary order ----
export interface ShippingMethod { id: string; name: string; description: string; eta: string; price: number; free_over?: number; carrier?: string; days_min?: number; days_max?: number; estimated?: boolean }
export interface CustomerInformation { email: string; phone: string }
export interface Address { first_name: string; last_name: string; address1: string; address2?: string; city: string; state: string; zip: string; country: string }
export interface CheckoutData { contact: CustomerInformation; shipping_address: Address; billing_address: Address; billing_same_as_shipping: boolean; shipping_method_id: string; payment_method: string }
export interface OrderSummary { item_count: number; subtotal: number; discount: number; shipping: number; tax: number; total: number; coupon_code?: string; /** true on the cart page when carrier rates are only known at checkout */ shipping_pending?: boolean }
export interface OrderItem { product_id: string; variant_id?: string; name: string; slug?: string; variant_label?: string; sku?: string; image?: string; visual?: Product["visual"]; quantity: number; unit_price: number; line_total: number; weight_g?: number; pkg?: [number, number, number]; ship_mode?: ShipMode }
export interface TemporaryOrder { id: string; created_at: string; status: "pending-payment"; items: OrderItem[]; summary: OrderSummary; checkout: CheckoutData; shipping_method: ShippingMethod; estimated_delivery: string; shipping_detail?: ShippingDetail }

// ---- Shipping ----
/** What the customer is offered at checkout. */
export interface ShippingOption { id: string; name: string; carrier: string; service: string; price: number; days_min: number; days_max: number; estimated: boolean; note?: string }
/** Saved on the order so the admin knows how the shipping charge was made up. */
export interface ShippingDetail { charged: number; flat_part: number; carrier_part: number; free_by_threshold: boolean; weight_oz: number; parcel?: { l: number; w: number; h: number }; handling_days: number }
export interface ShipAddress { name: string; company?: string; street1: string; street2?: string; city: string; state: string; zip: string; country: string; phone?: string; email?: string }
export interface Parcel { weight_oz: number; l: number; w: number; h: number }
export interface RateOption { rate_id: string; carrier: string; service: string; amount: number; days?: number; terms?: string }

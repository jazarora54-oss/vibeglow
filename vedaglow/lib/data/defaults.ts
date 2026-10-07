/** Built-in DRAFT content. Everything here can be edited in /admin (Pages, FAQs, Settings). Review the policies before launch; they are templates, not legal advice. */
export interface SiteSettings { store_name: string; tagline: string; email: string; phone: string; whatsapp: string; address: string; hours: string; instagram: string; facebook: string; tiktok: string; youtube: string;
  // Shipping (admin -> Settings -> Shipping). free_shipping_over: 0 = switched off.
  free_shipping_over: number; default_flat_rate: number; ship_name: string; ship_company: string; ship_street1: string; ship_street2: string; ship_city: string; ship_state: string; ship_zip: string; ship_phone: string }
export const DEFAULT_SETTINGS: SiteSettings = { store_name: "VEDAGLOW", tagline: "Ancient Wisdom. Modern Glow.", email: "", phone: "", whatsapp: "", address: "", hours: "", instagram: "", facebook: "", tiktok: "", youtube: "", free_shipping_over: 49, default_flat_rate: 5.99, ship_name: "", ship_company: "", ship_street1: "", ship_street2: "", ship_city: "", ship_state: "", ship_zip: "", ship_phone: "" };

export const PAGE_SLUGS = ["about", "contact", "shipping", "returns", "refunds", "privacy", "terms", "faq"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];
export const isPageSlug = (s: string): s is PageSlug => (PAGE_SLUGS as readonly string[]).includes(s);

export const DEFAULT_PAGES: Record<PageSlug, { title: string; body: string }> = {
  about: { title: "About VEDAGLOW", body: `## Ancient Wisdom. Modern Glow.

VEDAGLOW brings together time-honoured natural ingredients and modern care for your skin, hair, body and everyday wellness.

## What we believe
- **Natural first.** We favour plant-based ingredients and tell you exactly what is inside every product.
- **Honest information.** Each product page lists ingredients, how to use it and what to expect.
- **Care for you.** If you ever need help, our team is one message away.

## Our range
Skin Care, Hair Care, Body Care, Health & Wellness and Oral Care, all in one place.

Have a question? [Contact us](/contact).` },
  contact: { title: "Contact Us", body: `We would love to hear from you. Send us a message using the form and we will get back to you as soon as we can.

For help with an existing order, include your order number. You can also check progress any time on the [Track Order](/track-order) page.` },
  shipping: { title: "Shipping Policy", body: `## Where we ship
We currently ship within the **United States** with USPS, UPS and FedEx.

## Shipping cost
- Many products show **Free shipping** on the product page.
- Other products show a shipping charge, or "calculated at checkout" (the real carrier price for your address).
- Your exact shipping cost and delivery estimate are shown at checkout **before you pay**.

## Processing time
Orders are packed and handed to the carrier within the handling time shown on the product (usually 1 to 3 business days). Delivery time starts after that.

## Tracking
When your order ships you will get a tracking number. You can follow it any time on the [Track Order](/track-order) page.

## Problems with delivery
If your parcel is late, damaged or missing, please [contact us](/contact) with your order number and we will help.` },
  returns: { title: "Returns & Exchanges", body: `## Our promise
If you are not happy with your purchase, tell us and we will make it right.

## How returns work
- Contact us within **7 days** of receiving your order.
- Products should be **unopened and unused** so that they can be resold safely.
- Because these are personal-care products, opened items cannot be returned unless they arrived damaged or faulty.

## Damaged or wrong item
If something arrives damaged or is not what you ordered, [contact us](/contact) with photos and your order number and we will send a replacement or refund.

See also our [Refund Policy](/refunds).` },
  refunds: { title: "Refund Policy", body: `## Approved returns
Once we receive and check your return, we will confirm by email. Approved refunds go back to your original payment method.

## Timing
Refunds are usually processed within **5 to 10 business days** after approval. Your bank may need extra time to show it.

## Shipping costs
Original shipping is refunded only if the return is due to our error (damaged, faulty or wrong item).

## Questions
[Contact us](/contact) and include your order number.` },
  privacy: { title: "Privacy Policy", body: `## What we collect
When you place an order or contact us we collect your name, email, phone number, delivery and billing address, and the items you bought.

## How we use it
- To process and deliver your orders and answer your messages.
- To send order updates.
- To send offers and news **only if you agree** to receive them. You can unsubscribe at any time.

## Who sees it
We do not sell your personal information. We share it only with services needed to run the store, such as hosting, payment and delivery providers.

## Your choices
You can ask us to see, correct or delete your information by [contacting us](/contact).

## Cookies
We use cookies and similar storage to keep your cart and sign-in working.` },
  terms: { title: "Terms & Conditions", body: `## Using this website
By using this website and placing an order you agree to these terms.

## Products and prices
We try to keep descriptions, prices and stock accurate. If we find an error we may correct it or cancel the order and refund you.

## Orders
An order is confirmed when we accept it. We may decline or cancel an order, for example if an item is out of stock.

## Health information
Our products are for personal care and general wellness. They are not intended to diagnose, treat or cure any condition. If you have allergies or a medical condition, check the ingredients and talk to a professional first.

## Changes
We may update these terms from time to time. Continued use of the site means you accept the latest version.

## Contact
Questions? [Contact us](/contact).` },
  faq: { title: "Frequently Asked Questions", body: `Find quick answers below. Cannot find yours? [Contact us](/contact).` },
};

export interface Faq { id?: string; question: string; answer: string; keywords: string; sort_order?: number; is_active?: boolean }
export const DEFAULT_FAQS: Faq[] = [
  { question: "How long does shipping take?", answer: "Orders ship within 1 to 3 business days, then the carrier (USPS, UPS or FedEx) usually delivers in 2 to 7 business days. You will see the estimated delivery date at checkout before you pay.", keywords: "shipping delivery long days arrive time ship when" },
  { question: "Do you offer free shipping?", answer: "Yes. Many products ship free and are marked \"Free shipping\" on the product page. For other products the shipping cost is shown on the product page or at checkout before you pay.", keywords: "free shipping cost price delivery charge how much" },
  { question: "How can I track my order?", answer: "Open the Track Order page (/track-order) and enter your order number and the email you used at checkout.", keywords: "track tracking order status where parcel package" },
  { question: "What is your return policy?", answer: "You can contact us within 7 days of delivery to return unopened, unused products. Damaged or wrong items are always replaced or refunded. Details: /returns", keywords: "return returns refund exchange money back" },
  { question: "How do I use a coupon code?", answer: "Enter your code in the cart under Order Summary and press Apply. New customers can use WELCOME10 for 10% off their first order.", keywords: "coupon code discount promo offer welcome10 voucher" },
  { question: "Are your products natural?", answer: "VEDAGLOW focuses on natural, plant-based ingredients. Open any product and check the Ingredients tab for the full list.", keywords: "natural ingredients organic herbal chemical safe cruelty" },
  { question: "Can I change or cancel my order?", answer: "Please contact us as soon as possible with your order number (/contact). We can change or cancel an order only before it ships.", keywords: "cancel change modify edit order address" },
  { question: "What payment methods do you accept?", answer: "Available payment options are shown at checkout.", keywords: "payment pay card cash cod credit debit paypal method" },
  { question: "How do I contact you?", answer: "Use our Contact page (/contact) and we will reply as soon as we can.", keywords: "contact email phone support help reach talk human" },
];

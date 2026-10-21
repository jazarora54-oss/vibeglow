import PromoForm from "@/components/admin/PromoForm";
import { getSiteSettings } from "@/lib/data/site";
export default async function Page() {
  const s = await getSiteSettings();
  return <div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Popup &amp; Top bar</h1>
    <p className="text-sm text-ink/60">Write your own message for the strip at the very top of the website, and a pop-up that welcomes visitors with a message and a coupon code. Changes go live as soon as you save.</p>
    <PromoForm initial={{ topbar_text: s.topbar_text, topbar_show_shipping: s.topbar_show_shipping, popup_enabled: s.popup_enabled, popup_title: s.popup_title, popup_message: s.popup_message, popup_code: s.popup_code, popup_button_text: s.popup_button_text, popup_button_link: s.popup_button_link, popup_delay: s.popup_delay, newsletter_title: s.newsletter_title, newsletter_text: s.newsletter_text, newsletter_code: s.newsletter_code }} /></div>;
}

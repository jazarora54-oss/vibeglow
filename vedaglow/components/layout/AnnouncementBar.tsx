import { Leaf } from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { shipConfigOf } from "@/lib/shipping/settings";
import { money } from "@/lib/format";
/** Top strip. Your own text comes from admin -> Popup & Top bar. With no text it only shows the free-shipping offer, and only if you set one up. Nothing is invented. */
export default async function AnnouncementBar() {
  const s = await getSiteSettings(); const { freeOver } = shipConfigOf(s); const custom = (s.topbar_text ?? "").trim();
  const ship = freeOver > 0 && (!custom || s.topbar_show_shipping);
  if (!ship && !custom) return null;
  return <div className="bg-forest px-4 py-2 text-center text-xs text-white sm:text-sm"><Leaf size={14} className="mr-2 inline text-gold-light" />
    {ship && <><b className="text-gold-light">FREE SHIPPING</b> on orders over {money(freeOver)}{custom && <span className="mx-1 text-gold-light"> | </span>}</>}
    {custom && <b className="text-gold-light">{custom}</b>}</div>;
}

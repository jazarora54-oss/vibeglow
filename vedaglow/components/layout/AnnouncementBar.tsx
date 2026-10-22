import { getSiteSettings } from "@/lib/data/site";
import { shipConfigOf } from "@/lib/shipping/settings";
import { money } from "@/lib/format";
import { isHex, textOn } from "@/lib/theme";
import { safeLink, topbarInDates, topbarLines } from "@/lib/topbar";
import TopBarText from "./TopBarText";
/** Top strip. Text, colour, link and dates come from admin -> Popup & Top bar. With no text it only shows the free-shipping offer, and only if you set one up. Nothing is invented. */
export default async function AnnouncementBar() {
  const s = await getSiteSettings(); const { freeOver } = shipConfigOf(s);
  if (!topbarInDates(s)) return null;
  const lines = topbarLines(s.topbar_text); const ship = freeOver > 0 && (!lines.length || s.topbar_show_shipping);
  if (!ship && !lines.length) return null;
  const bg = isHex(s.topbar_bg) ? s.topbar_bg : ""; const fg = bg ? textOn(bg) : "";
  return <div className={`px-4 py-2 text-center text-xs sm:text-sm ${bg ? "" : "bg-forest text-white"}`} style={bg ? { background: bg, color: fg } : undefined}>
    <TopBarText lines={lines} ship={ship ? `FREE SHIPPING on orders over ${money(freeOver)}` : ""} link={safeLink(s.topbar_link)} accent={bg ? "" : "text-gold-light"} /></div>;
}

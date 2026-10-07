import { Leaf } from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { shipConfigOf } from "@/lib/shipping/settings";
import { money } from "@/lib/format";
export default async function AnnouncementBar() {
  const { freeOver } = shipConfigOf(await getSiteSettings());
  return <div className="bg-forest px-4 py-2 text-center text-xs text-white sm:text-sm"><Leaf size={14} className="mr-2 inline text-gold-light" />
    {freeOver > 0 && <><b className="text-gold-light">FREE SHIPPING</b> on orders over {money(freeOver)} <span className="mx-1 text-gold-light">|</span> </>}<b className="text-gold-light">10% OFF</b> on your first order – Use code: <b className="text-gold-light">WELCOME10</b></div>;
}

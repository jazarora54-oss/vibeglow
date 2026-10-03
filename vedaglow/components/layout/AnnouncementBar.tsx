import { Leaf } from "lucide-react";
export default function AnnouncementBar() {
  return <div className="bg-forest px-4 py-2 text-center text-xs text-white sm:text-sm"><Leaf size={14} className="mr-2 inline text-gold-light" />
    <b className="text-gold-light">FREE SHIPPING</b> on orders over $49 <span className="mx-1 text-gold-light">|</span> <b className="text-gold-light">10% OFF</b> on your first order – Use code: <b className="text-gold-light">WELCOME10</b></div>;
}

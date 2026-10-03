import type { CartItem as Item } from "@/types";
import { lineKey } from "@/components/CartProvider";
import CartItem from "./CartItem";
export default function CartList({ items }: { items: Item[] }) { return <ul className="space-y-4">{items.map(i => <CartItem key={lineKey(i)} item={i} />)}</ul>; }

import type { CartItem } from "@/types";
import ProductImage from "@/components/product/ProductImage";
export default function CartThumb({ item, className = "h-20 w-20" }: { item: Pick<CartItem, "image" | "visual" | "name">; className?: string }) {
  const visual = item.visual ?? { kind: "bottle" as const, label: item.name ?? "Product", color: "#1E6B3F" };
  return <div className={`grid shrink-0 place-items-center rounded-xl bg-cream-dark p-2 ${className}`}><ProductImage product={{ images: item.image ? [item.image] : [], visual, name: item.name ?? "Product" }} className="h-full w-full" /></div>;
}

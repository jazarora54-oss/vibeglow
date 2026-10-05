import ProductForm from "@/components/admin/ProductForm";
import type { ProductInput } from "@/lib/data/mappers";
const blank: ProductInput = { id: "", slug: "", name: "", short_description: "", category: "skin-care", price: 0, images: [], visual: { kind: "bottle", label: "", color: "#E9D2B4" }, tags: [], stock: 0, is_active: true };
export default function Page() { return <div><h1 className="mb-5 font-display text-4xl font-semibold text-forest">Add product</h1><ProductForm initial={blank} isNew /></div>; }

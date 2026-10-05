import ProductForm, { emptyProduct } from "@/components/admin/ProductForm";
export default function Page() { return <div><h1 className="mb-5 font-display text-4xl font-semibold text-forest">Add product</h1><ProductForm initial={emptyProduct()} isNew /></div>; }

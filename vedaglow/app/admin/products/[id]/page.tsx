import Link from "next/link";
import { notFound } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { rowToProduct } from "@/lib/data/mappers";
import ProductForm from "@/components/admin/ProductForm";
export default async function Page({ params }: { params: { id: string } }) {
  const { data } = await serverClient().from("products").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const { created_at, rating, review_count, ...p } = rowToProduct(data); void created_at; void rating; void review_count;
  return <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-4xl font-semibold text-forest">Edit product</h1><Link href={`/product/${p.slug}`} target="_blank" className="text-sm font-semibold text-forest underline">View on website ↗</Link></div>
    <ProductForm initial={{ ...p, is_active: data.is_active }} isNew={false} /></div>;
}

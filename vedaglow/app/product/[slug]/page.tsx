import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { getProductReviews } from "@/lib/data/reviews";
import { CATEGORY_OPTIONS } from "@/lib/shop";
import { ProductSelectionProvider } from "@/components/product/ProductSelection";
import ProductGallery from "@/components/product/ProductGallery";
import PurchasePanel from "@/components/product/PurchasePanel";
import TrustFeatures from "@/components/product/TrustFeatures";
import ProductDetails from "@/components/product/ProductDetails";
import ProductInformation from "@/components/product/ProductInformation";
import ProductReviews from "@/components/product/ProductReviews";
import ProductSection from "@/components/product/ProductSection";
import MobilePurchaseBar from "@/components/product/MobilePurchaseBar";
type Props = { params: { slug: string } };
export async function generateMetadata({ params }: Props) { const p = await getProductBySlug(params.slug); return { title: p ? `${p.name} | VEDAGLOW` : "Product not found | VEDAGLOW", description: p?.short_description }; }
export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const cat = CATEGORY_OPTIONS.find(c => c.slug === product.category);
  const [related, reviews] = await Promise.all([getRelatedProducts(product, 4), getProductReviews(product.id)]);
  const crumb = "flex items-center gap-1";
  return (
    <ProductSelectionProvider product={product}>
      <div className="pb-24 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-ink/60">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className={crumb}><ChevronRight size={14} /><Link href="/shop" className="hover:text-forest">Shop</Link></span>
            {cat && <span className={crumb}><ChevronRight size={14} /><Link href={`/category/${cat.slug}`} className="hover:text-forest">{cat.name}</Link></span>}
            <span className={crumb}><ChevronRight size={14} /><span className="text-forest">{product.name}</span></span>
          </nav>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="min-w-0 lg:sticky lg:top-36 lg:self-start"><ProductGallery product={product} /></div>
            <PurchasePanel />
          </div>
        </div>
        <div className="px-4 sm:px-6"><TrustFeatures /></div>
        <ProductDetails />
        <ProductInformation product={product} />
        <ProductReviews product={product} reviews={reviews} />
        <ProductSection title="You May Also Like" products={related} href={cat ? `/category/${cat.slug}` : "/shop"} />
      </div>
      <MobilePurchaseBar />
    </ProductSelectionProvider>
  );
}

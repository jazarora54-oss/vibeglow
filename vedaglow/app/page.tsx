import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import ServiceBar from "@/components/home/ServiceBar";
import Newsletter from "@/components/home/Newsletter";
import ProductSection from "@/components/product/ProductSection";
import { getCategories } from "@/lib/data/categories";
import { getProducts, getRelatedProducts } from "@/lib/data/products";
export default async function Home() {
  const [cats, best, fresh, sale, featured] = await Promise.all([
    getCategories(), getProducts({ tag: "best-seller", limit: 5 }), getProducts({ tag: "new", limit: 4 }),
    getProducts({ tag: "sale", limit: 4 }), getProducts({ tag: "featured", limit: 4 })]);
  const related = await getRelatedProducts(best[0], 4);
  return (<>
    <HeroSection products={[best[2], best[4], featured[1] ?? best[0], best[1]]} />
    <CategorySection categories={cats} />
    <ProductSection title="Best Sellers" products={best} href="/shop" tabs={["Featured", "New Arrivals", "Best Sellers", "On Sale"]} />
    <ProductSection title="New Arrivals" subtitle="Fresh from the VEDAGLOW shelf" products={fresh} href="/new-arrivals" />
    <ProductSection title="On Sale" subtitle="Natural care for less" products={sale} href="/sale" />
    <ProductSection title="Featured Products" products={featured} />
    <ProductSection title="You May Also Like" products={related} />
    <ServiceBar />
    <Newsletter />
  </>);
}

import HeroSection from "@/components/home/HeroSection";
import BannerSlider from "@/components/home/BannerSlider";
import CategorySection from "@/components/home/CategorySection";
import ServiceBar from "@/components/home/ServiceBar";
import Newsletter from "@/components/home/Newsletter";
import ProductSection from "@/components/product/ProductSection";
import { getCategories } from "@/lib/data/categories";
import { getBanners } from "@/lib/data/banners";
import { getProducts, getRelatedProducts } from "@/lib/data/products";
export default async function Home() {
  const [cats, banners, best, fresh, sale, featured] = await Promise.all([
    getCategories(), getBanners(), getProducts({ tag: "best-seller", limit: 5 }), getProducts({ tag: "new", limit: 4 }),
    getProducts({ tag: "sale", limit: 4 }), getProducts({ tag: "featured", limit: 4 })]);
  const any = best[0] ?? fresh[0] ?? sale[0] ?? featured[0];
  const related = any ? await getRelatedProducts(any, 4) : [];
  const heroProducts = [best[2], best[4], featured[1] ?? best[0], best[1]].filter((p): p is NonNullable<typeof p> => Boolean(p));
  return (<>
    {banners.length ? <BannerSlider banners={banners} /> : <HeroSection products={heroProducts} />}
    <CategorySection categories={cats} />
    {best.length > 0 && <ProductSection title="Best Sellers" products={best} href="/shop" tabs={["Featured", "New Arrivals", "Best Sellers", "On Sale"]} />}
    {fresh.length > 0 && <ProductSection title="New Arrivals" subtitle="Fresh from the VEDAGLOW shelf" products={fresh} href="/new-arrivals" />}
    {sale.length > 0 && <ProductSection title="On Sale" subtitle="Natural care for less" products={sale} href="/sale" />}
    {featured.length > 0 && <ProductSection title="Featured Products" products={featured} />}
    {related.length > 0 && <ProductSection title="You May Also Like" products={related} />}
    <ServiceBar />
    <Newsletter />
  </>);
}

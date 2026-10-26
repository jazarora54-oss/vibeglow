import HeroSection from "@/components/home/HeroSection";
import BannerSlider from "@/components/home/BannerSlider";
import CategorySection from "@/components/home/CategorySection";
import ServiceBar from "@/components/home/ServiceBar";
import Newsletter from "@/components/home/Newsletter";
import ProductSection from "@/components/product/ProductSection";
import { getCategories } from "@/lib/data/categories";
import { getBanners } from "@/lib/data/banners";
import { getProducts, getRelatedProducts } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/site";
import { countOf, homeSectionsOf } from "@/lib/data/homeSections";
export default async function Home() {
  const st = await getSiteSettings(); const order = homeSectionsOf(st); const n = (k: string) => countOf(order, k);
  const [cats, banners, best, fresh, sale, featured] = await Promise.all([
    getCategories(), getBanners(), getProducts({ tag: "best-seller", limit: Math.max(5, n("best")) }), getProducts({ tag: "new", limit: n("new"), newest: true }),
    getProducts({ tag: "sale", limit: n("sale") }), getProducts({ tag: "featured", limit: n("featured") })]);
  const any = best[0] ?? fresh[0] ?? sale[0] ?? featured[0];
  const related = any ? await getRelatedProducts(any, n("related")) : [];
  const heroProducts = [best[2], best[4], featured[1] ?? best[0], best[1]].filter((p): p is NonNullable<typeof p> => Boolean(p));
  const T = (key: string, d: string) => order.find(r => r.key === key)?.title || d;
  const block: Record<string, React.ReactNode> = {
    banners: banners.length ? <BannerSlider banners={banners} /> : <HeroSection products={heroProducts} />,
    categories: <CategorySection categories={cats} />,
    best: best.length > 0 && <ProductSection title={T("best", "Best Sellers")} products={best} href="/shop" tabs={["Featured", "New Arrivals", "Best Sellers", "On Sale"]} />,
    new: fresh.length > 0 && <ProductSection title={T("new", "New Arrivals")} subtitle="Fresh from the VEDAGLOW shelf" products={fresh} href="/new-arrivals" />,
    sale: sale.length > 0 && <ProductSection title={T("sale", "On Sale")} subtitle="Natural care for less" products={sale} href="/sale" />,
    featured: featured.length > 0 && <ProductSection title={T("featured", "Featured Products")} products={featured} />,
    related: related.length > 0 && <ProductSection title={T("related", "You May Also Like")} products={related} />,
    service: <ServiceBar />,
    newsletter: <Newsletter title={st.newsletter_title} text={st.newsletter_text} />,
  };
  return (<>{order.filter(r => r.on).map(r => <div key={r.key} className="contents">{block[r.key]}</div>)}</>);
}

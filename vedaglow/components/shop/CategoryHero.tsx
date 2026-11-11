import Link from "next/link";
import type { CategoryBanner } from "@/lib/data/categoryBanners";
/** Category banner: the desktop picture, and a separate phone picture below 768px (never a squeezed desktop crop). */
export default function CategoryHero({ b, name }: { b: CategoryBanner; name: string }) {
  if (!b.desktop_image) return null; const alt = b.image_alt || b.heading || `${name} at VEDAGLOW`;
  const pic = (<picture>{b.mobile_image && <source media="(max-width: 767px)" srcSet={b.mobile_image} />}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={b.desktop_image} alt={alt} className="mx-auto block h-auto w-full max-md:max-h-[440px] max-md:w-auto max-md:max-w-full md:max-h-[600px] md:object-cover" /></picture>);
  const link = /^(\/(?!\/)|https:\/\/)/.test(b.button_link) ? b.button_link : "";
  return <section aria-label={`${name} banner`} className="overflow-hidden bg-cream">{link ? <Link href={link} className="block">{pic}</Link> : pic}</section>;
}

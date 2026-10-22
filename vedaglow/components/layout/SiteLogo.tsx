import Image from "next/image";
const H = { s: "h-12 sm:h-14", m: "h-16 sm:h-20", l: "h-20 sm:h-24" } as const;
export interface LogoProps { url?: string; alt?: string; size?: "s" | "m" | "l" }
/** The header logo: the uploaded one (admin -> Brand & Logo) or the original VEDAGLOW logo. */
export default function SiteLogo({ url, alt, size = "m", footer }: LogoProps & { footer?: boolean }) {
  const h = footer ? "h-24" : H[size] ?? H.m;
  if (url) /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={url} alt={alt || "VEDAGLOW"} className={`${h} w-auto max-w-[70vw] object-contain`} />;
  return <Image src="/logo.png" alt={alt || "VEDAGLOW – Ancient Wisdom. Modern Glow."} width={1024} height={1024} priority={!footer} className={`${h} w-auto mix-blend-multiply`} />;
}

import type { Product } from "@/types";
// Renders the real image when product.images[0] exists (Supabase Storage later); otherwise a branded packshot.
export default function ProductImage({ product, className = "" }: { product: Pick<Product, "images" | "visual" | "name">; className?: string }) {
  const src = product.images[0];
  if (src) return <img src={src} alt={product.name} className={`object-contain ${className}`} />;
  const { kind, color, label } = product.visual;
  const cap = "#B8872B";
  return (
    <svg viewBox="0 0 120 150" className={className} role="img" aria-label={product.name}>
      <ellipse cx="60" cy="140" rx="34" ry="5" fill="#0F3D26" opacity=".12" />
      {kind === "jar" && <><rect x="22" y="62" width="76" height="72" rx="10" fill={color} /><rect x="18" y="46" width="84" height="20" rx="6" fill={cap} /></>}
      {(kind === "bottle" || kind === "pump") && <><rect x="34" y="42" width="52" height="94" rx="12" fill={color} /><rect x="48" y="22" width="24" height="22" fill={cap} />{kind === "pump" && <path d="M48 24h34v-8H60" stroke={cap} strokeWidth="5" fill="none" />}</>}
      {kind === "tube" && <><path d="M34 40h52l-4 94H38z" fill={color} /><rect x="34" y="28" width="52" height="14" rx="3" fill={cap} /></>}
      {kind === "dropper" && <><rect x="38" y="62" width="44" height="72" rx="8" fill={color} /><rect x="42" y="46" width="36" height="18" fill={cap} /><rect x="52" y="24" width="16" height="24" rx="8" fill="#1F2A22" /></>}
      <rect x="30" y="86" width="60" height="30" rx="4" fill="#FBF8F1" opacity=".92" />
      <text x="60" y="97" textAnchor="middle" fontSize="7" fontFamily="Georgia,serif" fill="#8A6420">VEDAGLOW</text>
      <text x="60" y="108" textAnchor="middle" fontSize="6.5" fontFamily="sans-serif" fill="#0F3D26">{label}</text>
    </svg>
  );
}

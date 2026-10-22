import BrandForm from "@/components/admin/BrandForm";
import { getSiteSettings } from "@/lib/data/site";
export default async function Page() {
  const s = await getSiteSettings();
  return <div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Brand &amp; Logo</h1>
    <p className="text-sm text-ink/60">Upload your own logo and choose the website colours. Leave everything empty to keep the original VEDAGLOW logo and colours. Changes go live as soon as you save.</p>
    <BrandForm initial={{ logo_url: s.logo_url, logo_alt: s.logo_alt, logo_size: s.logo_size, color_primary: s.color_primary, color_accent: s.color_accent, color_bg: s.color_bg }} /></div>;
}

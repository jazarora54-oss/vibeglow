import HomepageManager from "@/components/admin/HomepageManager";
import { getSiteSettings } from "@/lib/data/site";
import { homeSectionsOf } from "@/lib/data/homeSections";
export default async function Page() {
  const s = await getSiteSettings();
  return <div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">Homepage</h1>
    <p className="text-sm text-ink/60">Choose which blocks appear on the homepage and in what order. A block with no products in it stays hidden by itself.</p>
    <HomepageManager initial={homeSectionsOf(s)} /></div>;
}

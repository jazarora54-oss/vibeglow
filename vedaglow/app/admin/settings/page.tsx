import SettingsForm from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/data/site";
import { shippoMode } from "@/lib/shipping/shippo";
export default async function Page() { return <div><h1 className="mb-5 font-display text-4xl font-semibold text-forest">Settings</h1><SettingsForm initial={await getSiteSettings()} shippo={shippoMode()} /></div>; }

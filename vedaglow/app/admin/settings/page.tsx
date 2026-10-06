import SettingsForm from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/data/site";
export default async function Page() { return <div><h1 className="mb-5 font-display text-4xl font-semibold text-forest">Settings</h1><SettingsForm initial={await getSiteSettings()} /></div>; }

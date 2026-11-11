import { redirect } from "next/navigation";
/** The AI banner studio is switched off for now: upload your own banner in Admin → Banners. */
export default function Page() { redirect("/admin/banners"); }

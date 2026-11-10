import { redirect } from "next/navigation";
/** The banner studio was removed: upload your own banners in Banners (homepage) or Category Design (category pages). */
export default function Page() { redirect("/admin/banners"); }

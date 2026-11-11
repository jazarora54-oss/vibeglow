import { redirect } from "next/navigation";
/** The AI product creator is switched off for now: products are added by hand (Admin → Products → Add product). */
export default function Page() { redirect("/admin/products/new"); }

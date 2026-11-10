import { redirect } from "next/navigation";
/** The AI product creator was removed: add products by hand in Products → Add product. */
export default function Page() { redirect("/admin/products"); }

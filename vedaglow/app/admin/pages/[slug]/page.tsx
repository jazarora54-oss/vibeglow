import Link from "next/link";
import { notFound } from "next/navigation";
import PageEditor from "@/components/admin/PageEditor";
import { DEFAULT_PAGES, isPageSlug } from "@/lib/data/defaults";
import { getPage } from "@/lib/data/site";
export default async function Page({ params }: { params: { slug: string } }) {
  if (!isPageSlug(params.slug)) notFound();
  const p = await getPage(params.slug); const d = DEFAULT_PAGES[params.slug];
  return <div><Link href="/admin/pages" className="text-sm font-semibold text-forest underline">← All pages</Link><h1 className="mb-5 mt-2 font-display text-4xl font-semibold text-forest">Edit: {d.title}</h1>
    <PageEditor slug={params.slug} initial={{ title: p.title, body: p.body }} defaultBody={d.body} defaultTitle={d.title} custom={p.custom} /></div>;
}

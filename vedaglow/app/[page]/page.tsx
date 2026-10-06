import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { isPageSlug } from "@/lib/data/defaults";
import { getFaqs, getPage, getSiteSettings } from "@/lib/data/site";
import { Markdown } from "@/lib/markdown";
import ContactForm from "@/components/pages/ContactForm";
type Props = { params: { page: string } };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isPageSlug(params.page)) return {};
  const p = await getPage(params.page);
  return { title: `${p.title} | VEDAGLOW`, description: p.body.replace(/[#*[\]()]/g, "").replace(/\s+/g, " ").trim().slice(0, 155), alternates: { canonical: `/${params.page}` } };
}
/** About, Contact, Shipping, Returns, Refunds, Privacy, Terms and FAQ. Text is edited in admin -> Pages / FAQs. */
export default async function InfoPage({ params }: Props) {
  if (!isPageSlug(params.page)) notFound();
  const slug = params.page; const page = await getPage(slug);
  const s = slug === "contact" ? await getSiteSettings() : null;
  const faqs = slug === "faq" ? await getFaqs() : [];
  const faqLd = slug === "faq" && faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) } : null;
  const wa = s?.whatsapp.replace(/[^\d]/g, "");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 font-display text-5xl font-semibold text-forest">{page.title}</h1>
      <Markdown text={page.body} />
      {slug === "contact" && s && <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <ul className="space-y-3 text-base text-ink/80">
          {s.email && <li className="flex items-center gap-2"><Mail size={18} className="text-gold" /><a className="underline" href={`mailto:${s.email}`}>{s.email}</a></li>}
          {s.phone && <li className="flex items-center gap-2"><Phone size={18} className="text-gold" /><a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a></li>}
          {wa && <li className="flex items-center gap-2"><MessageCircle size={18} className="text-gold" /><a className="underline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></li>}
          {s.address && <li className="flex items-start gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-gold" />{s.address}</li>}
          {s.hours && <li className="flex items-center gap-2"><Clock size={18} className="text-gold" />{s.hours}</li>}
        </ul>
        <ContactForm />
      </div>}
      {slug === "faq" && <div className="mt-8 divide-y divide-forest/10 rounded-2xl bg-white shadow-card">
        {faqs.map((f, i) => <details key={f.id ?? i} className="group px-5 py-4"><summary className="cursor-pointer list-none font-semibold text-forest">{f.question}</summary><p className="mt-2 leading-relaxed text-ink/80">{f.answer}</p></details>)}
      </div>}
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />}
    </div>
  );
}

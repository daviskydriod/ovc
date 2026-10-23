import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import QuoteForm from "@/components/contact/QuoteForm";
import { services } from "@/data/services";
import { cmsSections } from "@/data/cms-sections";
import { COMPANY } from "@/lib/company";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Contact Us", "Contact Okechukwu Venatius Chibuike Ltd. by telephone or submit a project quote enquiry.", "/contact");
type ContactPageProps = { searchParams: Promise<{ service?: string }> };

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const [params, content] = await Promise.all([searchParams, getPageContent("contact", cmsSections.contact.defaults)]);
  const requestedService = params.service ?? "";
  const initialService = services.some((service) => service.title === requestedService) ? requestedService : "";
  return (
    <main id="main-content">
      <section className="page-hero"><div className="page-hero-grid shell"><div><p className="eyebrow">Contact OVC</p><h1>{content.heroTitle}</h1><p className="page-hero-description">{content.heroDescription}</p></div><aside className="page-hero-aside"><p>{content.sidebar}</p></aside></div></section>
      <section className="page-content"><div className="contact-grid shell">
        <aside className="contact-details"><p className="eyebrow">Telephone enquiries</p><h2>Talk to the team</h2><p>Tap a number to place a call. The source numbers are shown as supplied, with their international format in the call link.</p><ul className="contact-phone-list">{COMPANY.phones.map((phone) => <li key={phone.href}><a href={phone.href}><Phone size={15} aria-hidden="true" /> {phone.display}</a><span className="country-label">{phone.country}</span></li>)}</ul><p className="contact-note"><strong>WhatsApp:</strong> A WhatsApp link is not included until its availability is verified for a supplied number. No email address or office location was provided for publication.</p><p className="contact-note">This is a preview form only. Submissions are validated in the browser but are not sent or stored.</p><Link className="text-link" href="/services">Review services <ArrowUpRight size={15} aria-hidden="true" /></Link></aside>
        <section className="quote-card" id="quote" aria-labelledby="quote-title"><div className="quote-card-header"><p className="eyebrow">Project enquiry</p><h2 id="quote-title">{content.quoteTitle}</h2><p>{content.quoteDescription}</p></div><QuoteForm initialService={initialService} /></section>
      </div></section>
    </main>
  );
}

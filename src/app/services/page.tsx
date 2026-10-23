import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ServiceCard from "@/components/services/ServiceCard";
import { cmsSections } from "@/data/cms-sections";
import { services } from "@/data/services";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Services", "Explore construction, painting, architectural finishing, maintenance and project coordination services listed by OVC.", "/services");

export default async function ServicesPage() {
  const content = await getPageContent("services", cmsSections.services.defaults);
  return (
    <main id="main-content">
      <section className="page-hero"><div className="page-hero-grid shell"><div><p className="eyebrow">Service scope</p><h1>{content.heroTitle}</h1><p className="page-hero-description">{content.heroDescription}</p></div><aside className="page-hero-aside"><p>{content.sidebar}</p></aside></div></section>
      <section className="page-content"><div className="shell"><div className="services-page-grid">{services.map((service) => <ServiceCard key={service.id} service={service} />)}</div><p className="services-note"><strong>Design and engineering scope:</strong> Civil & Architectural Design and Structural Design are listed as enquiry areas only. Confirm the actual scope and applicable professional qualifications before appointing regulated design or engineering work.</p></div></section>
      <section className="section section-muted"><div className="cta-panel shell"><div><p className="eyebrow">Project enquiry</p><h2>{content.ctaHeading}</h2><p>{content.ctaDescription}</p></div><Link className="button button-gold" href="/contact#quote">Make an Enquiry <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}

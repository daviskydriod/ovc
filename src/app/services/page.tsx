import Link from "next/link";
import { ArrowRight, Building2, Brush, ClipboardList, HardHat, Layers3, Wrench } from "lucide-react";
import ServiceCard from "@/components/services/ServiceCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { cmsSections } from "@/data/cms-sections";
import { services } from "@/data/services";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Services", "Explore construction, painting, architectural finishing, maintenance and project coordination services listed by OVC.", "/services");
export const revalidate = 300;
const groups = [
  { title: "Construction & site", text: "General construction, contracting, site supervision and project management enquiries.", Icon: Building2 },
  { title: "Painting & finishes", text: "Interior and exterior painting and design, wall screeding, wallpaper installation and stucco finishing.", Icon: Brush },
  { title: "Products & upkeep", text: "Paint production, sales of paint and building maintenance requirements.", Icon: Wrench },
  { title: "Design enquiries", text: "Civil, architectural and structural design areas are listed for initial scope discussion.", Icon: Layers3 },
];
const process = ["Choose the service or services closest to your needs.", "Describe the property, location and requested outcome.", "Share any plans, finish preferences or known constraints.", "Discuss scope, availability and next steps with the company."];

export default async function ServicesPage() {
  const content = await getPageContent("services", cmsSections.services.defaults);
  return (
    <main id="main-content">
      <section className="page-hero"><div className="page-hero-grid shell"><div><p className="eyebrow">Service scope</p><h1>{content.heroTitle}</h1><p className="page-hero-description">{content.heroDescription}</p></div><aside className="page-hero-aside"><p>{content.sidebar}</p></aside></div></section>
      <section className="page-content"><div className="shell"><SectionHeading eyebrow="Service directory" title="Explore the full service list" description="Select a service to start an enquiry. The exact scope is discussed based on your project requirements." /><div className="services-page-grid">{services.map((service) => <ServiceCard key={service.id} service={service} />)}</div></div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Grouped by project need" title="Related services across your project" description="A project may involve more than one of the service areas listed by OVC." /><div className="values-grid">{groups.map(({ title, text, Icon }, index) => <article className="value-card" key={title}><span className="value-number">0{index + 1}</span><Icon size={22} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Project enquiry" title="Help us understand what you need" description="Useful information helps the team discuss the appropriate service and scope." /><ol className="values-grid">{process.map((item, index) => <li className="value-card" key={item}><span className="value-number">0{index + 1}</span><h3>{["Select a service", "Describe the project", "Add useful context", "Discuss next steps"][index]}</h3><p>{item}</p></li>)}</ol></div></section>
      <section className="section section-muted"><div className="about-split shell"><div className="about-copy"><p className="eyebrow">Scope and qualification</p><h2>Confirm specialist work before appointment.</h2><p><strong>Design and engineering scope:</strong> Civil &amp; Architectural Design and Structural Design are listed as enquiry areas only. Confirm the exact scope and applicable professional qualifications before appointing regulated design or engineering work.</p><p>Any final scope, materials, site requirements and project arrangements should be discussed and agreed directly with the company.</p><Link className="text-link" href="/contact#quote">Discuss a service <ArrowRight size={16} aria-hidden="true" /></Link></div><div className="project-feature-copy"><HardHat size={30} aria-hidden="true"/><h3>Clear requirements support clear discussions.</h3><p>Share the project type, location, requested work and any available plans or references.</p></div></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Common questions" title="Before you make an enquiry" description="Use these answers to prepare a useful project brief." /><div className="values-grid"><article className="value-card"><h3>Can I ask about several services?</h3><p>Yes. Describe each part of the project in your enquiry so the scope can be discussed together.</p></article><article className="value-card"><h3>Do you need a project location?</h3><p>Include the town or area and any details that help identify where the work is required.</p></article><article className="value-card"><h3>Are plans required?</h3><p>You can begin with a description. Mention whether drawings, specifications or references are available.</p></article><article className="value-card"><h3>Are regulated design services confirmed?</h3><p>No. Confirm the specific scope and applicable professional qualifications before appointing regulated work.</p></article></div></div></section>
      <section className="section section-muted"><div className="cta-panel shell"><div><p className="eyebrow">Project enquiry</p><h2>{content.ctaHeading}</h2><p>{content.ctaDescription}</p></div><Link className="button button-gold" href="/contact#quote">Send an enquiry <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}

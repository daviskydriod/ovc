import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ClientImage from "@/components/projects/ClientImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { projectImages } from "@/data/project-images";
import { cmsSections } from "@/data/cms-sections";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("About Us", "Learn about Okechukwu Venatius Chibuike Ltd. and its construction, architectural finishing and maintenance service scope.", "/about");
const focusAreas = ["Construction services", "Architectural finishing", "Building maintenance", "Customer satisfaction"];

export default async function AboutPage() {
  const content = await getPageContent("about", cmsSections.about.defaults);
  const image = projectImages.find((item) => item.src.includes("building-construction"))!;
  return (
    <main id="main-content">
      <section className="page-hero"><div className="page-hero-grid shell"><div><p className="eyebrow">About the company</p><h1>{content.heroTitle}</h1><p className="page-hero-description">{content.heroDescription}</p></div><aside className="page-hero-aside"><p>“YOUR SATISFACTION IS OUR UTMOST PRIORITY.”</p></aside></div></section>
      <section className="page-content"><div className="about-split shell"><div className="about-visual"><ClientImage src={image.src} alt={image.alt} /></div><div className="about-copy"><p className="eyebrow">Okechukwu Venatius Chibuike Ltd.</p><h2>{content.storyHeading}</h2><p>{content.storyBody}</p><p>{content.commitment}</p><ul className="about-qualities">{focusAreas.map((area) => <li key={area}><span className="quality-check"><Check size={15} aria-hidden="true" /></span>{area}</li>)}</ul><Link className="button button-navy" href="/services">Explore Services <ArrowRight size={16} aria-hidden="true" /></Link></div></div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Our approach" title={content.approachHeading} description={content.approachDescription} /><div className="values-grid"><article className="value-card"><span className="value-number">01</span><h3>Discuss the brief</h3><p>Share the requirements, service needed and project location.</p></article><article className="value-card"><span className="value-number">02</span><h3>Clarify the scope</h3><p>Review project details and confirm what work is required.</p></article><article className="value-card"><span className="value-number">03</span><h3>Plan next steps</h3><p>Contact the company to discuss how to proceed with an enquiry.</p></article><article className="value-card"><span className="value-number">04</span><h3>Stay customer-focused</h3><p>Keep quality workmanship and customer satisfaction in focus.</p></article></div></div></section>
      <section className="section"><div className="cta-panel shell"><div><p className="eyebrow">Discuss your requirements</p><h2>Let's talk about your project.</h2><p>Contact the company to discuss a construction, painting or finishing enquiry.</p></div><Link className="button button-gold" href="/contact#quote">Request a Quote <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}

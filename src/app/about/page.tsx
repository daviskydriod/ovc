import Link from "next/link";
import { ArrowRight, ClipboardList, Compass, Handshake, Layers3, ShieldCheck, Wrench } from "lucide-react";
import ClientImage from "@/components/projects/ClientImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { projectImages } from "@/data/project-images";
import { cmsSections } from "@/data/cms-sections";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("About Us", "Learn about Okechukwu Venatius Chibuike Ltd. and its construction, architectural finishing and maintenance service scope.", "/about");
export const revalidate = 300;
const principles = [
  { title: "Quality workmanship", text: "Keep workmanship and the requirements of the brief at the centre of project discussions.", Icon: ShieldCheck },
  { title: "Customer focus", text: "The company’s stated motto places customer satisfaction as its utmost priority.", Icon: Handshake },
  { title: "Clear scope", text: "Discuss the location, requested service, site conditions and expected work before defining next steps.", Icon: ClipboardList },
  { title: "Coordinated services", text: "Construction, finishing, maintenance and project coordination are among the supplied service areas.", Icon: Layers3 },
];
const steps = ["Share your project requirements and location.", "Identify the service areas and work scope to discuss.", "Review the project details and any relevant site conditions.", "Agree on the appropriate next steps directly with the company."];

export default async function AboutPage() {
  const content = await getPageContent("about", cmsSections.about.defaults);
  const image = projectImages.find((item) => item.src.includes("building-construction"))!;
  return (
    <main id="main-content">
      <section className="page-hero"><div className="page-hero-grid shell"><div><p className="eyebrow">About the company</p><h1>{content.heroTitle}</h1><p className="page-hero-description">{content.heroDescription}</p></div><aside className="page-hero-aside"><p>“YOUR SATISFACTION IS OUR UTMOST PRIORITY.”</p></aside></div></section>
      <section className="page-content"><div className="about-split shell"><div className="about-visual"><ClientImage src={image.src} alt={image.alt} /></div><div className="about-copy"><p className="eyebrow">Okechukwu Venatius Chibuike Ltd.</p><h2>{content.storyHeading}</h2><p>{content.storyBody}</p><p>{content.commitment}</p><Link className="button button-navy" href="/services">Explore services <ArrowRight size={16} aria-hidden="true" /></Link></div></div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="What guides our work" title="A customer-focused construction partner" description="The company’s supplied brief emphasizes quality workmanship, customer satisfaction and a broad construction and finishing scope." /><div className="values-grid">{principles.map(({ title, text, Icon }, index) => <article className="value-card" key={title}><span className="value-number">0{index + 1}</span><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Areas of work" title="Services for building projects" description="OVC’s stated scope brings together construction, finishes, maintenance and project coordination." /><div className="values-grid">{[{ title: "Construction", text: "General construction, contracting and site supervision enquiries.", Icon: Compass }, { title: "Finishing", text: "Painting and design, wall screeding, wallpaper and stucco finishing.", Icon: Layers3 }, { title: "Maintenance", text: "Building maintenance and paint sales or production enquiries.", Icon: Wrench }, { title: "Coordination", text: "Project management and coordination requirements can be discussed.", Icon: ClipboardList }].map(({ title, text, Icon }, i) => <article className="value-card" key={title}><span className="value-number">0{i + 1}</span><Icon size={22} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="How to get started" title={content.approachHeading} description={content.approachDescription} /><ol className="values-grid">{steps.map((step, index) => <li className="value-card" key={step}><span className="value-number">0{index + 1}</span><h3>{["Tell us about the project", "Clarify the scope", "Review the requirements", "Discuss next steps"][index]}</h3><p>{step}</p></li>)}</ol></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Company information" title="A factual introduction" description="This profile stays within the information provided for the website. Company history, leadership, credentials and project records can be added when verified details are supplied." /><div className="project-feature-copy"><p>Okechukwu Venatius Chibuike Ltd. presents itself as a construction and architectural finishing company. Its service list includes general construction, civil and architectural design enquiries, structural design enquiries, painting, maintenance and project coordination. Regulated design and engineering appointments should be confirmed against the appropriate scope and professional qualifications.</p></div></div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Frequently asked" title="About working with OVC" description="A few practical points for starting a project conversation." /><div className="values-grid"><article className="value-card"><h3>What services can I ask about?</h3><p>Use the Services page to see the supplied scope, then share the requirements that best describe your project.</p></article><article className="value-card"><h3>What should I include?</h3><p>Provide the service, project location, a brief description and any key requirements you already know.</p></article><article className="value-card"><h3>Can I discuss design work?</h3><p>Design areas are listed for enquiry. Confirm scope and applicable professional qualifications before an appointment.</p></article><article className="value-card"><h3>How do I reach the team?</h3><p>Use the enquiry form or the verified telephone numbers on the Contact page.</p></article></div></div></section>
      <section className="section"><div className="cta-panel shell"><div><p className="eyebrow">Discuss your requirements</p><h2>Let’s talk about your project.</h2><p>Contact the company to discuss a construction, painting or finishing enquiry.</p></div><Link className="button button-gold" href="/contact#quote">Send a project enquiry <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}

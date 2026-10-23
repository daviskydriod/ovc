import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import ClientImage from "@/components/projects/ClientImage";
import ServiceCard from "@/components/services/ServiceCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { projectImages, featuredProjectImage } from "@/data/project-images";
import { cmsSections } from "@/data/cms-sections";
import { services } from "@/data/services";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Construction & Architectural Finishing", "Professional construction, architectural finishing and building maintenance services focused on quality workmanship and customer satisfaction.", "/");

const strengths = [
  { number: "01", title: "Attention to detail", text: "A quality-focused approach to construction and finishing requirements." },
  { number: "02", title: "Range of services", text: "A broad scope spanning construction, finishing, maintenance and coordination." },
  { number: "03", title: "Project coordination", text: "Clear discussion of project requirements, scope and next steps." },
  { number: "04", title: "Customer satisfaction", text: "Workmanship and service focused on customer satisfaction." },
];

export default async function HomePage() {
  const content = await getPageContent("home", cmsSections.home.defaults);
  const feature = projectImages.find((image) => image.src.includes("masonry-construction")) || featuredProjectImage;
  const miniImages = [
    projectImages.find((image) => image.src.includes("window-detail-photo"))!,
    projectImages.find((image) => image.src.includes("building-construction"))!,
    projectImages.find((image) => image.src.includes("exterior-render-01"))!,
  ];
  return (
    <main id="main-content">
      <section className="hero">
        <div className="hero-grid shell">
          <div className="hero-copy">
            <p className="eyebrow">{content.heroEyebrow}</p>
            <h1>{content.heroTitle}<span>{content.heroHighlight}</span></h1>
            <p className="hero-description">{content.heroDescription}</p>
            <div className="hero-actions"><Link className="button button-gold" href="/contact#quote">Request a Quote <ArrowRight size={17} aria-hidden="true" /></Link><Link className="button button-outline-dark" href="/projects">View Our Projects <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
            <p className="hero-annotation">A practical approach to every project conversation</p>
          </div>
          <div className="hero-media"><ClientImage className="hero-photo" src={featuredProjectImage.src} alt={featuredProjectImage.alt} priority sizes="(max-width: 768px) 100vw, 52vw" /><div className="hero-media-note"><span>Client-supplied image</span>Building image provided for the OVC website.</div></div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Company service focus"><div className="trust-grid shell">{["Construction services", "Architectural finishing", "Building maintenance", "Customer-focused workmanship"].map((item) => <div className="trust-item" key={item}><span className="trust-item-mark" aria-hidden="true" /><span>{item}</span></div>)}</div></section>

      <section className="section" aria-labelledby="home-services-heading"><div className="shell"><SectionHeading eyebrow="What we do" title="Our construction & finishing services" description="Explore the service areas in the company's supplied scope. Share your requirements and the project details can be discussed directly." /><div className="services-grid">{services.slice(0, 6).map((service) => <ServiceCard key={service.id} service={service} compact />)}</div><div className="section-link-row"><Link className="text-link" href="/services">View all services <ArrowRight size={16} aria-hidden="true" /></Link></div></div></section>

      <section className="section section-muted" aria-labelledby="home-projects-heading"><div className="shell"><SectionHeading eyebrow="Portfolio" title={content.projectsHeading} description={content.projectsDescription} /><div className="project-feature"><ClientImage src={feature.src} alt={feature.alt} sizes="(max-width: 768px) 100vw, 60vw" /><div className="project-feature-copy"><p className="eyebrow">Client-supplied construction image</p><h3>Images shown as provided.</h3><p>The gallery includes submitted photos, renderings, details and drawings. No project details or completion claims have been assumed.</p><Link className="button button-navy" href="/projects">View the portfolio <ArrowRight size={16} aria-hidden="true" /></Link></div></div><div className="project-mini-grid" aria-label="More client-supplied images">{miniImages.map((image) => <article className="project-card" key={image.src}><ClientImage src={image.src} alt={image.alt} sizes="(max-width: 768px) 100vw, 33vw" /><span className="project-card-label">{image.category} · Client-supplied</span></article>)}</div></div></section>

      <section className="section"><div className="about-split shell"><div className="about-visual"><ClientImage src={projectImages.find((image) => image.src.includes("building-construction"))!.src} alt={projectImages.find((image) => image.src.includes("building-construction"))!.alt} /></div><div className="about-copy"><p className="eyebrow">About OVC</p><h2 id="home-about-heading">{content.aboutHeading}</h2><p>{content.aboutIntro}</p><p>{content.aboutDetails}</p><ul className="about-qualities"><li><span className="quality-check"><Check size={15} aria-hidden="true" /></span>Construction and finishing</li><li><span className="quality-check"><Check size={15} aria-hidden="true" /></span>Painting and design</li><li><span className="quality-check"><Check size={15} aria-hidden="true" /></span>Project coordination</li><li><span className="quality-check"><Check size={15} aria-hidden="true" /></span>Maintenance enquiries</li></ul><Link className="text-link" href="/about">About the company <ArrowRight size={16} aria-hidden="true" /></Link></div></div></section>

      <section className="section section-muted" aria-labelledby="why-heading"><div className="shell"><SectionHeading eyebrow="Why OVC" title="A considered approach to your project" description="Practical strengths drawn from the brief—not unverified statistics or credentials." /><div className="values-grid">{strengths.map((item) => <article className="value-card" key={item.number}><span className="value-number">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>

      <section className="section"><div className="cta-panel shell"><div><p className="eyebrow">Start a conversation</p><h2>{content.ctaHeading}</h2><p>{content.ctaDescription}</p></div><Link className="button button-gold" href="/contact">Contact Us <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
    </main>
  );
}

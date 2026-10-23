import Link from "next/link";
import { ArrowRight, Camera, FileImage, Image as ImageIcon, MapPin, Ruler } from "lucide-react";
import ClientImage from "@/components/projects/ClientImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { projectImages, defaultProjectImagePaths } from "@/data/project-images";
import { cmsSections } from "@/data/cms-sections";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedProjects } from "@/lib/projects-api";

export const metadata = pageMetadata("Projects & Portfolio", "Client-supplied construction photographs, architectural renderings, details and drawings.", "/projects");
export const revalidate = 300;
const visualTypes = [
  { title: "Construction photographs", text: "Site and building photographs are presented using the supplied captions and image descriptions.", Icon: Camera },
  { title: "Architectural renderings", text: "Design visuals are identified as renderings and are not presented as completed work.", Icon: ImageIcon },
  { title: "Details and drawings", text: "Detail images and drawings provide visual references without assumed project names or dates.", Icon: Ruler },
  { title: "Client-provided assets", text: "The current gallery uses image files supplied for OVC’s website, not stock or generated imagery.", Icon: FileImage },
];

export default async function ProjectsPage() {
  const [content, managedProjects] = await Promise.all([getPageContent("projects", cmsSections.projects.defaults), getPublishedProjects()]);
  const requested = Array.isArray(content.images) ? content.images : defaultProjectImagePaths;
  const selected = requested.map((src) => projectImages.find((image) => image.src === src)).filter((image): image is (typeof projectImages)[number] => Boolean(image));
  const gallery = selected.length ? selected : projectImages;
  const featured = gallery[0];
  const remainder = gallery.slice(1);
  return (
    <main id="main-content">
      <section className="page-hero"><div className="page-hero-grid shell"><div><p className="eyebrow">Portfolio</p><h1>{content.heroTitle}</h1><p className="page-hero-description">{content.heroDescription}</p></div><aside className="page-hero-aside"><p>{content.sidebar}</p></aside></div></section>
      {managedProjects.length > 0 && <section className="section"><div className="shell"><SectionHeading eyebrow="Published project records" title="Projects added by the OVC team" description="These project details are published from the content management system."/><div className="project-gallery-grid">{managedProjects.map((project) => <article className="project-card client-gallery-card" key={project.id}>{project.cover_url && <img className="managed-project-cover" src={project.cover_url} alt={project.cover_alt_text || project.title} loading="lazy" decoding="async"/>}<div className="project-feature-copy"><span className="project-card-label">{project.category || "Project"}</span><h2>{project.title}</h2>{project.summary && <p>{project.summary}</p>}<p>{project.description}</p></div></article>)}</div></div></section>}
      <section className="page-content"><div className="shell"><SectionHeading eyebrow="Featured visual" title="A closer look at the supplied work" description="Images are shown as provided. Captions identify their visual type where available." />{featured && <figure className="project-gallery-feature client-gallery-feature"><ClientImage src={featured.src} alt={featured.alt} sizes="100vw" priority /><figcaption><span>{featured.category}</span>{featured.title}</figcaption></figure>}</div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Image gallery" title="Browse the client-supplied collection" description="Photos, renderings, details and drawings provided for the company website." /><div className="project-gallery-grid">{remainder.map((image) => <figure className="project-card client-gallery-card" key={image.src}><ClientImage src={image.src} alt={image.alt} sizes="(max-width: 768px) 100vw, 33vw" /><figcaption><strong>{image.title}</strong><span>{image.category}</span></figcaption></figure>)}</div></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Understanding the gallery" title="Different visuals, clearly described" description="The images are a visual introduction only; they do not establish project ownership, location, dates or completion status." /><div className="values-grid">{visualTypes.map(({ title, text, Icon }, index) => <article className="value-card" key={title}><span className="value-number">0{index + 1}</span><Icon size={22} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="section section-muted"><div className="about-split shell"><div className="about-copy"><p className="eyebrow">Portfolio notes</p><h2>Context matters as much as the image.</h2><p>{content.galleryNote}</p><p>No project names, locations, budgets, dates, completion claims or client identities are inferred from the submitted visuals.</p></div><div className="project-feature-copy"><MapPin size={28} aria-hidden="true"/><h3>Looking for a specific type of work?</h3><p>Contact OVC with your requirements and the team can discuss the service scope relevant to your project.</p></div></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Start a project discussion" title="How to share your project brief" description="A few details can help frame an enquiry; plans and references are useful if already available." /><ol className="values-grid">{["Choose a service from the service directory.", "Include your project location and type of property.", "Describe the requested work and any finish preferences.", "Attach or refer to plans and images when appropriate."].map((text, index) => <li className="value-card" key={text}><span className="value-number">0{index + 1}</span><h3>{["Identify the service", "Add the location", "Describe the scope", "Share references"][index]}</h3><p>{text}</p></li>)}</ol></div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Questions" title="About these project images" description="The collection is kept factual and clearly labelled." /><div className="values-grid"><article className="value-card"><h3>Are all images completed projects?</h3><p>Not necessarily. Renderings and drawings are labelled as visuals; no completion claim is made for any image.</p></article><article className="value-card"><h3>Are project names or locations available?</h3><p>No verified project names or locations were supplied with the images.</p></article><article className="value-card"><h3>Can I ask about similar work?</h3><p>Yes. Describe the work you need in the enquiry form so the relevant service scope can be discussed.</p></article><article className="value-card"><h3>Can the gallery be updated?</h3><p>Approved client visuals can be selected and organized through the site content dashboard.</p></article></div></div></section>
      <section className="section"><div className="cta-panel shell"><div><p className="eyebrow">Plan a project</p><h2>Have a project in mind?</h2><p>Talk to the company about your construction, painting or finishing requirements.</p></div><Link className="button button-gold" href="/contact#quote">Make a project enquiry <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}

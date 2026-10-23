import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClientImage from "@/components/projects/ClientImage";
import { projectImages, defaultProjectImagePaths } from "@/data/project-images";
import { cmsSections } from "@/data/cms-sections";
import { getPageContent } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Projects & Portfolio", "Client-supplied construction photographs, architectural renderings, details and drawings.", "/projects");

export default async function ProjectsPage() {
  const content = await getPageContent("projects", cmsSections.projects.defaults);
  const requested = Array.isArray(content.images) ? content.images : defaultProjectImagePaths;
  const selected = requested.map((src) => projectImages.find((image) => image.src === src)).filter((image): image is (typeof projectImages)[number] => Boolean(image));
  const gallery = selected.length ? selected : projectImages;
  const featured = gallery[0];
  const remainder = gallery.slice(1);
  return (
    <main id="main-content">
      <section className="page-hero"><div className="page-hero-grid shell"><div><p className="eyebrow">Portfolio</p><h1>{content.heroTitle}</h1><p className="page-hero-description">{content.heroDescription}</p></div><aside className="page-hero-aside"><p>{content.sidebar}</p></aside></div></section>
      <section className="page-content"><div className="shell">
        {featured && <figure className="project-gallery-feature client-gallery-feature"><ClientImage src={featured.src} alt={featured.alt} sizes="100vw" priority /><figcaption><span>{featured.category}</span>{featured.title}</figcaption></figure>}
        <div className="project-gallery-grid">{remainder.map((image) => <figure className="project-card client-gallery-card" key={image.src}><ClientImage src={image.src} alt={image.alt} sizes="(max-width: 768px) 100vw, 33vw" /><figcaption><strong>{image.title}</strong><span>{image.category}</span></figcaption></figure>)}</div>
        <p className="project-gallery-note">{content.galleryNote}</p>
      </div></section>
      <section className="section section-muted"><div className="cta-panel shell"><div><p className="eyebrow">Plan a project</p><h2>Have a project in mind?</h2><p>Talk to the company about your construction, painting or finishing requirements.</p></div><Link className="button button-gold" href="/contact#quote">Request a Quote <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
  );
}

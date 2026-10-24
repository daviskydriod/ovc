import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Image as ImageIcon } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedProjects } from "@/lib/projects-api";

export const metadata = pageMetadata("Projects", "Explore selected construction, renovation and finishing projects by OVC.", "/projects");
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  return (
    <main id="main-content">
      <section className="page-hero"><div className="shell"><p className="eyebrow">Our work</p><h1>Projects</h1><p className="page-hero-description">Explore a selection of OVC construction, renovation and finishing work.</p></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Selected work" title="Recent projects" description="A closer look at projects and design work from OVC."/>{projects.length ? <div className="project-gallery-grid">{projects.map((project) => <article className="project-card client-gallery-card" key={project.id}>{project.cover_url ? <img className="managed-project-cover" src={project.cover_url} alt={project.cover_alt_text || project.title} loading="lazy" decoding="async"/> : <div className="project-card-image-placeholder"><ImageIcon size={26} aria-hidden="true"/><span>Project photo coming soon</span></div>}<div className="project-feature-copy"><span className="project-card-label">{project.category || "Project"}</span><h2>{project.title}</h2><p>{project.summary || project.description.slice(0, 190)}</p><Link className="text-link" href={`/projects/${project.slug}`}>View project <ArrowRight size={15} aria-hidden="true"/></Link></div></article>)}</div> : <div className="project-api-empty"><BriefcaseBusiness size={30} aria-hidden="true"/><h3>Our project gallery is being updated</h3><p>While we prepare more examples of our work, tell us about the project you have in mind.</p><Link className="button button-navy" href="/contact#quote">Discuss your project <ArrowRight size={15} aria-hidden="true"/></Link></div>}</div></section>
      <section className="section"><div className="cta-panel shell"><div><p className="eyebrow">Start a conversation</p><h2>Planning a project?</h2><p>Share your requirements with the OVC team and let’s talk about the next steps.</p></div><Link className="button button-gold" href="/contact#quote">Make an enquiry <ArrowRight size={16} aria-hidden="true"/></Link></div></section>
    </main>
  );
}

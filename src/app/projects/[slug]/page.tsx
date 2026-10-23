import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText, Layers3 } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { getPublishedProject, getPublishedProjects } from "@/lib/projects-api";
import { getVerifiedPublicOrigin } from "@/lib/company";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: "Project not found" };
  const description = project.summary || project.description.slice(0, 155);
  const origin = getVerifiedPublicOrigin();
  const canonical = origin ? new URL(`/projects/${project.slug}`, origin).toString() : undefined;
  return {
    title: `${project.title} | OVC Projects`,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title: project.title, description, type: "article", url: canonical, images: project.cover_url ? [{ url: project.cover_url, alt: project.cover_alt_text || project.title }] : undefined },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();
  return (
    <main id="main-content">
      <section className="page-hero"><div className="shell"><Link className="text-link" href="/projects"><ArrowLeft size={15} aria-hidden="true"/> Back to projects</Link><p className="eyebrow">{project.category || "Project"}</p><h1>{project.title}</h1>{project.summary && <p className="page-hero-description">{project.summary}</p>}</div></section>
      <section className="page-content"><div className="shell"><SectionHeading eyebrow="Project visual" title="Project image" description="The image and its description were supplied or selected by the OVC administrator."/>{project.cover_url ? <figure className="managed-project-detail-image"><img src={project.cover_url} alt={project.cover_alt_text || project.title} fetchPriority="high"/><figcaption>{project.cover_alt_text || project.title}</figcaption></figure> : <div className="project-feature-copy"><Layers3 size={28} aria-hidden="true"/><p>No cover image is currently attached to this project record.</p></div>}</div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Project overview" title="About this project" description="Project details published by OVC."/><div className="project-feature-copy"><p className="project-detail-description">{project.description}</p></div></div></section>
      <section className="section"><div className="about-split shell"><div className="about-copy"><p className="eyebrow">Service category</p><h2>{project.category || "Construction and finishing"}</h2><p>{project.summary || "Contact OVC to discuss the scope and requirements relevant to your project."}</p></div><div className="project-feature-copy"><FileText size={28} aria-hidden="true"/><h3>Published project information</h3><p>Project records are maintained by the OVC website administrator. No unprovided locations, dates, budgets or completion claims are added by this page.</p></div></div></section>
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Portfolio" title="Explore more visuals" description="Browse the wider client-supplied gallery of photographs, renderings and drawings."/><Link className="button button-navy" href="/projects">View all projects <ArrowRight size={16} aria-hidden="true"/></Link></div></section>
      <section className="section"><div className="shell"><SectionHeading eyebrow="Project questions" title="Discuss a similar requirement" description="If you are enquiring about related work, share your location, service and scope with the team."/><div className="values-grid"><article className="value-card"><h3>Which service should I select?</h3><p>Use the Services directory to identify the closest supplied service area.</p></article><article className="value-card"><h3>What project details help?</h3><p>Include the location, property context, requested work and any available references.</p></article><article className="value-card"><h3>Are all portfolio visuals completed work?</h3><p>Photos, renderings and drawings are labelled according to supplied information; no completion status is assumed.</p></article><article className="value-card"><h3>How can I contact OVC?</h3><p>Submit a project enquiry or use the phone and WhatsApp links on the Contact page.</p></article></div></div></section>
      <section className="section"><div className="cta-panel shell"><div><p className="eyebrow">Start a conversation</p><h2>Discuss your project with OVC.</h2><p>Share your requirements through the project enquiry form.</p></div><Link className="button button-gold" href="/contact#quote">Send an enquiry <ArrowRight size={16} aria-hidden="true"/></Link></div></section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
      <section className="page-hero"><div className="shell"><Link className="text-link" href="/projects"><ArrowLeft size={15} aria-hidden="true"/> All projects</Link><p className="eyebrow">{project.category || "Our work"}</p><h1>{project.title}</h1>{project.summary && <p className="page-hero-description">{project.summary}</p>}</div></section>
      {project.cover_url && <section className="page-content"><div className="shell"><figure className="managed-project-detail-image"><img src={project.cover_url} alt={project.cover_alt_text || project.title} fetchPriority="high"/></figure></div></section>}
      <section className="section section-muted"><div className="shell"><SectionHeading eyebrow="Project overview" title="About this project"/><div className="project-feature-copy"><p className="project-detail-description">{project.description}</p></div></div></section>
      <section className="section"><div className="cta-panel shell"><div><p className="eyebrow">Have something similar in mind?</p><h2>Let’s discuss your project.</h2><p>Tell us what you’re planning, where the work is needed and how we can help.</p></div><Link className="button button-gold" href="/contact#quote">Make an enquiry <ArrowRight size={16} aria-hidden="true"/></Link></div></section>
    </main>
  );
}

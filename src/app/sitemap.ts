import type { MetadataRoute } from "next";
import { getVerifiedPublicOrigin } from "@/lib/company";
import { getPublishedProjects } from "@/lib/projects-api";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getVerifiedPublicOrigin();
  if (!origin) return [];
  const routes = ["/", "/about", "/services", "/projects", "/contact"];
  const base = routes.map((route) => ({ url: new URL(route, origin).toString(), changeFrequency: "monthly" as const, priority: route === "/" ? 1 : 0.7 }));
  const projects = await getPublishedProjects();
  return [...base, ...projects.map((project) => ({ url: new URL(`/projects/${project.slug}`, origin).toString(), lastModified: project.updated_at, changeFrequency: "monthly" as const, priority: 0.6 }))];
}

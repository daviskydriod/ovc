import type { MetadataRoute } from "next";
import { getVerifiedPublicOrigin } from "@/lib/company";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getVerifiedPublicOrigin();
  if (!origin) return [];
  const routes = ["/", "/about", "/services", "/projects", "/contact"];
  return routes.map((route) => ({ url: new URL(route, origin).toString(), changeFrequency: "monthly", priority: route === "/" ? 1 : 0.7 }));
}

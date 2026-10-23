import type { MetadataRoute } from "next";
import { publicUrl } from "@/lib/company";

export default function robots(): MetadataRoute.Robots {
  const sitemap = publicUrl("/sitemap.xml");
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, ...(sitemap ? { sitemap } : {}) };
}

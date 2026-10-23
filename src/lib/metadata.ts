import type { Metadata } from "next";
import { COMPANY, getVerifiedPublicOrigin, publicUrl } from "@/lib/company";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const canonical = publicUrl(path);
  const origin = getVerifiedPublicOrigin();
  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      type: "website",
      siteName: COMPANY.name,
      title,
      description,
      ...(canonical ? { url: canonical } : {}),
      ...(origin ? { images: [{ url: new URL("/brand/ovc-master-logo.png", origin).toString(), width: 1959, height: 803, alt: `${COMPANY.name} original logo` }] } : {}),
    },
    twitter: {
      card: origin ? "summary_large_image" : "summary",
      title,
      description,
      ...(origin ? { images: [new URL("/brand/ovc-master-logo.png", origin).toString()] } : {}),
    },
  };
}

import type { Metadata } from "next";
import "@fontsource-variable/inter/index.css";
import "@fontsource-variable/montserrat/index.css";
import "./globals.css";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { COMPANY, getVerifiedPublicOrigin } from "@/lib/company";

const publicOrigin = getVerifiedPublicOrigin();
const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY.name,
  telephone: COMPANY.phones.map((phone) => phone.href.replace("tel:", "")),
  ...(publicOrigin ? { url: publicOrigin.toString() } : {}),
};

export const metadata: Metadata = {
  metadataBase: publicOrigin,
  title: { default: "Okechukwu Venatius Chibuike Ltd. | Construction & Finishing", template: "%s | OVC" },
  description: "Professional construction, architectural finishing and building maintenance services focused on quality workmanship and customer satisfaction.",
  applicationName: COMPANY.name,
  openGraph: {
    type: "website",
    siteName: COMPANY.name,
    title: "Okechukwu Venatius Chibuike Ltd. | Construction & Finishing",
    description: "Professional construction, architectural finishing and building maintenance services focused on quality workmanship and customer satisfaction.",
    ...(publicOrigin ? { url: publicOrigin.toString(), images: [{ url: "/brand/ovc-master-logo.png", width: 1959, height: 803, alt: "Original OVC master logo" }] } : {}),
  },
  twitter: {
    card: publicOrigin ? "summary_large_image" : "summary",
    title: "Okechukwu Venatius Chibuike Ltd. | Construction & Finishing",
    description: "Professional construction, architectural finishing and building maintenance services focused on quality workmanship and customer satisfaction.",
    ...(publicOrigin ? { images: ["/brand/ovc-master-logo.png"] } : {}),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}

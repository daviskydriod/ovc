import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Page not found | OVC",
  description: "The requested OVC company website page could not be found.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <main id="main-content" className="not-found-page"><div className="shell not-found-inner"><p className="eyebrow">404 · Page not found</p><h1>We couldn't find that page.</h1><p>The page may have moved, or the address may be incorrect.</p><Link className="button button-navy" href="/"><ArrowLeft size={16} aria-hidden="true" /> Return to Home</Link></div></main>;
}

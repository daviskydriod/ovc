import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Phone } from "lucide-react";
import { services } from "@/data/services";
import { COMPANY } from "@/lib/company";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main shell">
        <div className="footer-brand-column">
          <Link className="footer-logo-link" href="/" aria-label={`${COMPANY.name} home`}>
            <Image src="/brand/ovc-reverse-white-transparent.png" alt={`${COMPANY.name} logo`} width={369} height={220} className="footer-logo" sizes="(max-width: 700px) 110px, 120px" />
          </Link>
          <p>Construction and architectural finishing, with a focus on considered workmanship and customer care.</p>
          <span className="footer-motto">{COMPANY.motto}</span>
        </div>
        <nav className="footer-column" aria-label="Footer navigation">
          <h2>Explore</h2>
          <ul className="footer-link-list">
            <li><Link href="/about">About the company</Link></li>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/projects">Selected work</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </nav>
        <div className="footer-column">
          <h2>Service areas</h2>
          <ul className="footer-link-list footer-service-list">
            {services.slice(0, 5).map((service) => <li key={service.id}><Link href={`/services#${service.id}`}>{service.title}</Link></li>)}
            <li><Link className="footer-all-services" href="/services">See all services <ArrowRight size={14} aria-hidden="true" /></Link></li>
          </ul>
        </div>
        <div className="footer-column footer-contact-column">
          <h2>Talk to our team</h2>
          <p>Call to discuss your project requirements.</p>
          <ul className="footer-phone-list">{COMPANY.phones.map((phone) => <li key={phone.href}><a href={phone.href}><Phone size={14} aria-hidden="true" /><span><strong>{phone.display}</strong><small>{phone.country}</small></span></a></li>)}</ul>
          <Link className="footer-enquiry-link" href="/contact#quote">Tell us about your project <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="footer-bottom shell"><p>© {new Date().getFullYear()} {COMPANY.name}</p><p>Construction <span>·</span> Architectural finishing <span>·</span> Maintenance</p></div>
    </footer>
  );
}

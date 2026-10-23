import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/data/services";
import { COMPANY } from "@/lib/company";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main shell">
        <div className="footer-brand-column">
          <Link className="footer-logo-link" href="/" aria-label={`${COMPANY.name} home`}>
            <Image src="/brand/ovc-master-logo.png" alt={`${COMPANY.name} original logo`} width={1959} height={803} className="footer-logo" sizes="(max-width: 760px) 180px, 220px" />
          </Link>
          <p>Professional construction, architectural finishing and building maintenance services focused on quality workmanship and customer satisfaction.</p>
          <span className="footer-motto">{COMPANY.motto}</span>
        </div>
        <div className="footer-column">
          <h2>Quick links</h2>
          <ul className="footer-link-list">
            <li><Link href="/">Home</Link></li><li><Link href="/about">About Us</Link></li><li><Link href="/services">Services</Link></li><li><Link href="/projects">Projects</Link></li><li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h2>Services</h2>
          <ul className="footer-link-list footer-service-list">
            {services.slice(0, 5).map((service) => <li key={service.id}><Link href={`/services#${service.id}`}>{service.title}</Link></li>)}
            <li><Link href="/services">View all services</Link></li>
          </ul>
        </div>
        <div className="footer-column footer-contact-column">
          <h2>Contact</h2>
          <p>Call to discuss your project requirements.</p>
          <ul className="footer-phone-list">{COMPANY.phones.map((phone) => <li key={phone.href}><a href={phone.href}>{phone.display}</a><span>{phone.country}</span></li>)}</ul>
          <Link className="footer-enquiry-link" href="/contact#quote">Make an enquiry <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="footer-bottom shell"><p>© {new Date().getFullYear()} {COMPANY.name}</p><p>Construction · Architectural Finishing · Maintenance</p></div>
    </footer>
  );
}

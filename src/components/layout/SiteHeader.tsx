"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <Link className="logo-link" href="/" aria-label="Okechukwu Venatius Chibuike Ltd. home" onClick={() => setOpen(false)}>
          <Image src="/brand/ovc-master-logo.png" alt="Okechukwu Venatius Chibuike Ltd. — original OVC master logo" width={1959} height={803} priority className="brand-logo" sizes="(max-width: 760px) 180px, 240px" />
        </Link>
        <button className="menu-toggle" type="button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={21} /> : <Menu size={22} />}
        </button>
        <nav id="primary-navigation" className={`primary-navigation${open ? " is-open" : ""}`} aria-label="Primary navigation">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return <Link key={link.href} href={link.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>;
          })}
          <Link href="/contact#quote" className="button button-navy header-quote" onClick={() => setOpen(false)}>Request a Quote <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </nav>
      </div>
    </header>
  );
}

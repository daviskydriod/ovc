import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/data/services";

const brandIcons: Record<Service["icon"], string> = {
  paint: "/brand/icons/painting.png",
  wall: "/brand/icons/wall-screeding.png",
  product: "/brand/icons/paint-production.png",
  paper: "/brand/icons/wallpaper-installation.png",
  maintenance: "/brand/icons/maintenance.png",
  sales: "/brand/icons/paint-production.png",
  stucco: "/brand/icons/stucco-finishing.png",
  build: "/brand/icons/building-construction.png",
  site: "/brand/icons/site-supervision.png",
  contract: "/brand/icons/building-construction.png",
  manage: "/brand/icons/project-management.png",
  architecture: "/brand/icons/architectural-design.png",
  structure: "/brand/icons/architectural-design.png",
};

export default function ServiceCard({ service, compact = false }: { service: Service; compact?: boolean }) {
  return (
    <article className={`service-card${compact ? " service-card-compact" : ""}`} id={service.id}>
      <span className="service-icon"><Image src={brandIcons[service.icon]} alt="" width={30} height={30} aria-hidden="true" /></span>
      <div className="service-card-copy"><h3>{service.title}</h3><p>{compact ? service.summary : service.detail}</p></div>
      <Link className="service-enquiry-link" href={`/contact?service=${encodeURIComponent(service.title)}#quote`} aria-label={`Enquire about ${service.title}`}>Enquire <ArrowUpRight size={15} aria-hidden="true" /></Link>
    </article>
  );
}

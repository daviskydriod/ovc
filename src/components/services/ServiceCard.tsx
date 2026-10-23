import Link from "next/link";
import { ArrowUpRight, Brush, Building2, ClipboardList, Droplets, HardHat, Layers3, PaintBucket, PanelsTopLeft, PenTool, Ruler, SprayCan, Wallpaper, Wrench } from "lucide-react";
import type { Service } from "@/data/services";

const icons = { paint: Brush, wall: Layers3, product: Droplets, paper: Wallpaper, maintenance: Wrench, sales: PaintBucket, stucco: SprayCan, build: Building2, site: HardHat, contract: ClipboardList, manage: ClipboardList, architecture: PenTool, structure: Ruler };

export default function ServiceCard({ service, compact = false }: { service: Service; compact?: boolean }) {
  const Icon = icons[service.icon];
  return (
    <article className={`service-card${compact ? " service-card-compact" : ""}`} id={service.id}>
      <span className="service-icon"><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
      <div className="service-card-copy"><h3>{service.title}</h3><p>{compact ? service.summary : service.detail}</p></div>
      <Link className="service-enquiry-link" href={`/contact?service=${encodeURIComponent(service.title)}#quote`} aria-label={`Enquire about ${service.title}`}>Enquire <ArrowUpRight size={15} aria-hidden="true" /></Link>
    </article>
  );
}

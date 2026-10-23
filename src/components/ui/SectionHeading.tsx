export default function SectionHeading({ eyebrow, title, description, light = false }: { eyebrow?: string; title: string; description?: string; light?: boolean }) {
  return <div className={`section-heading${light ? " section-heading-light" : ""}`}>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p className="section-heading-description">{description}</p>}</div>;
}

import Image from "next/image";

export default function ClientImage({ src, alt, className = "", priority = false, sizes = "(max-width: 768px) 100vw, 50vw" }: { src: string; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  return <div className={`client-image ${className}`}><Image src={src} alt={alt} fill sizes={sizes} priority={priority} /></div>;
}

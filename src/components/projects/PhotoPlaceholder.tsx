import { Image as ImageIcon } from "lucide-react";

export default function PhotoPlaceholder({ className = "", label = "Client project photography pending" }: { className?: string; label?: string }) {
  return (
    <div className={`photo-placeholder ${className}`} role="img" aria-label={label}>
      <div className="placeholder-frame" aria-hidden="true">
        <span className="placeholder-building placeholder-building-one" />
        <span className="placeholder-building placeholder-building-two" />
        <span className="placeholder-building placeholder-building-three" />
        <i className="placeholder-rule placeholder-rule-one" /><i className="placeholder-rule placeholder-rule-two" />
        <span className="placeholder-icon"><ImageIcon size={18} strokeWidth={1.5} /></span>
      </div>
      <span className="placeholder-label">{label}</span>
    </div>
  );
}

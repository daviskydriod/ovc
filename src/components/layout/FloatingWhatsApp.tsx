import { MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/company";

const ghanaPhone = COMPANY.phones.find((phone) => phone.country === "Ghana");

export default function FloatingWhatsApp() {
  if (!ghanaPhone) return null;

  const href = `${ghanaPhone.whatsapp}?text=${encodeURIComponent("Hello OVC, I would like to discuss a project.")}`;

  return (
    <a
      className="floating-whatsapp"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with OVC on WhatsApp at ${ghanaPhone.display}`}
    >
      <MessageCircle size={22} strokeWidth={2.25} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}

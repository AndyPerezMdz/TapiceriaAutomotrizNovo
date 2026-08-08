"use client";

import { buildWhatsAppLink } from "@/lib/constants/business";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const href = buildWhatsAppLink(
    "Hola, me gustaría más información sobre sus servicios",
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
    >
      <MessageCircle size={26} fill="white" strokeWidth={0} />
    </a>
  );
}
import { ContactForm } from "@/components/contact/ContactForm";
import { businessInfo, formatWhatsApp } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { Clock, MapPin, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | Tapicería Automotriz by NOVO",
};

export default async function ContactoPage() {
  const settings = await getBusinessSettings();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${businessInfo.name}, ${businessInfo.address}`,
  )}&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Contáctanos
        </h1>
        <p className="mt-3 text-muted">
          ¿Tienes dudas o quieres una cotización? Escríbenos.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Formulario */}
        <div className="rounded-lg border border-black/10 bg-surface p-6 shadow-sm dark:border-white/10 sm:p-8">
          <ContactForm />
        </div>

        {/* Info + mapa */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border border-black/10 bg-surface p-6 shadow-sm dark:border-white/10">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="mt-0.5 shrink-0 text-brand-yellow-dark dark:text-brand-yellow" />
              <div>
                <p className="font-medium text-foreground">Dirección</p>
                <p className="text-sm text-muted">{businessInfo.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={20} className="mt-0.5 shrink-0 text-brand-yellow-dark dark:text-brand-yellow" />
              <div>
                <p className="font-medium text-foreground">Horario</p>
                <p className="text-sm text-muted">Lunes a Viernes: {settings.hoursWeekday}</p>
                <p className="text-sm text-muted">Sábado: {settings.hoursSaturday}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle size={20} className="mt-0.5 shrink-0 text-brand-yellow-dark dark:text-brand-yellow" />
              <div>
                <p className="font-medium text-foreground">WhatsApp</p>
                <p className="text-sm text-muted">{formatWhatsApp(settings.whatsapp)}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-black/10 shadow-sm dark:border-white/10">
            <iframe
              src={mapSrc}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación del taller"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
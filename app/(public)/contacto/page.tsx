import { ContactForm } from "@/components/contact/ContactForm";
import { ShopHours } from "@/components/auth/ShopHours";
import { businessInfo, buildWhatsAppLink, formatWhatsApp } from "@/lib/constants/business";
import Link from "next/link";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | Tapicería Automotriz by NOVO",
};

export default async function ContactoPage() {
  const settings = await getBusinessSettings();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${businessInfo.name}, ${businessInfo.address}`,
  )}&output=embed`;

  const whatsappHref = buildWhatsAppLink(
    "Hola, me gustaría más información sobre sus servicios",
    settings.whatsapp,
  );
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessInfo.address)}`;
  const label = "font-display text-[22px] font-bold uppercase leading-none tracking-[0.04em]";

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pb-24 sm:pt-16">
      <header className="animate-fade-up">
        <h1 className="font-display text-6xl font-extrabold uppercase leading-[0.9] text-foreground sm:text-[88px]">
          Contáctanos
        </h1>
        <p className="mt-3.5 max-w-xl text-[17px] leading-relaxed text-muted sm:text-lg">
          ¿Dudas o quieres una cotización? Lo más rápido es WhatsApp; si prefieres, déjanos un
          mensaje y te llamamos.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-start gap-6">
        {/* Tarjeta del taller */}
        <aside className="min-w-0 flex-[1_1_360px] rounded-[20px] bg-ink p-6 text-on-ink sm:p-8 dark:ring-1 dark:ring-white/10">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 items-center justify-center gap-2.5 rounded-[14px] bg-brand-yellow text-[17px] font-bold text-ink transition hover:bg-[#e8b90f]"
          >
            <MessageCircle size={20} /> Escribir por WhatsApp
          </a>
          <p className="mt-2.5 text-center text-[15px] text-on-ink-muted">
            {formatWhatsApp(settings.whatsapp)}
          </p>

          <div className="mt-6">
            <ShopHours hoursWeekday={settings.hoursWeekday} hoursSaturday={settings.hoursSaturday} />
          </div>

          <div className="mt-6 border-t-2 border-dashed border-brand-yellow/50 pt-5">
            <p className={label}>Dirección</p>
            <p className="mt-2 text-base leading-relaxed text-[#d9d5cc]">{businessInfo.address}</p>
            <div className="mt-4 overflow-hidden rounded-[14px] bg-ink-soft">
              <iframe
                src={mapSrc}
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del taller"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5">
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-[15px] font-semibold text-brand-yellow hover:underline"
              >
                Abrir en Google Maps →
              </a>
              <a
                href={businessInfo.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-[15px] font-semibold text-brand-yellow hover:underline"
              >
                Facebook →
              </a>
            </div>
          </div>
        </aside>

        {/* Formulario */}
        <section className="min-w-0 flex-[1_1_460px] rounded-[20px] bg-surface p-6 sm:p-9 dark:ring-1 dark:ring-white/5">
          <h2 className="font-display text-[34px] font-extrabold uppercase leading-none text-foreground">
            Déjanos un mensaje
          </h2>
          <p className="mb-6 mt-2 text-[15px] text-muted">Te contestamos en horario del taller.</p>
          <ContactForm />
          <div className="mt-6 border-t-2 border-dashed border-seam pt-4 text-[15px] text-muted">
            ¿Ya sabes lo que quieres?{" "}
            <Link href="/registro" className="font-bold text-foreground underline-offset-4 hover:underline">
              Pide tu cotización en línea
            </Link>{" "}
            y síguela desde tu celular.
          </div>
        </section>
      </div>
    </div>
  );
}

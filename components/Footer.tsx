import { businessInfo } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { buildWhatsAppLink, formatWhatsApp } from "@/lib/constants/business";
import { FooterLogo } from "@/components/FooterLogo";
import { MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

export async function Footer() {
  const settings = await getBusinessSettings();
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessInfo.address)}`;
  const whatsappHref = buildWhatsAppLink(
    "Hola, me gustaría más información sobre sus servicios",
    settings.whatsapp,
  );

  return (
    <footer className="border-t border-black/10 bg-surface dark:border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-4">
          <div>
            <FooterLogo />
            <p className="mt-4 text-sm text-muted">
              Pasión por el detalle, en cada vehículo que pasa por nuestras manos.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-yellow-dark dark:text-brand-yellow">
              Horario
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>
                <span className="text-foreground">Lunes a Viernes:</span>{" "}
                {settings.hoursWeekday}
              </li>
              <li>
                <span className="text-foreground">Sábado:</span> {settings.hoursSaturday}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-yellow-dark dark:text-brand-yellow">
              Contacto
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-muted">
              <li>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 transition hover:text-foreground"
                >
                  <MapPin
                    size={16}
                    className="mt-0.5 shrink-0 text-brand-yellow-dark dark:text-brand-yellow"
                  />
                  <span>{businessInfo.address}</span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-foreground"
                >
                  <MessageCircle
                    size={16}
                    className="shrink-0 text-brand-yellow-dark dark:text-brand-yellow"
                  />
                  <span>{formatWhatsApp(settings.whatsapp)}</span>
                </a>
              </li>
              <li>
                <a
                  href={businessInfo.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-foreground"
                >
                  <span className="shrink-0 text-brand-yellow-dark dark:text-brand-yellow">
                    <FacebookIcon size={16} />
                  </span>
                  <span>Facebook</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-yellow-dark dark:text-brand-yellow">
              Legal
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>
                <Link href="/terminos" className="transition hover:text-foreground">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="transition hover:text-foreground">
                  Aviso de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-black/10 pt-6 text-center text-xs text-muted dark:border-white/10">
          <p>
            © {new Date().getFullYear()} Tapicería Automotriz by NOVO. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
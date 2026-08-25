import { businessInfo } from "@/lib/constants/business";
import { FooterLogo } from "@/components/FooterLogo";
import { Link as LinkIcon, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-surface dark:border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
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
              {businessInfo.hours.map((h) => (
                <li key={h.days}>
                  <span className="text-foreground">{h.days}:</span> {h.time}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-yellow-dark dark:text-brand-yellow">
              Contacto
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2">
                <MapPin
                  size={16}
                  className="mt-0.5 shrink-0 text-brand-yellow-dark dark:text-brand-yellow"
                />
                <span>{businessInfo.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle
                  size={16}
                  className="shrink-0 text-brand-yellow-dark dark:text-brand-yellow"
                />
                <span>{businessInfo.whatsappFormatted}</span>
              </li>
              <li>
                <a
                  href={businessInfo.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-foreground"
                >
                  <LinkIcon
                    size={16}
                    className="shrink-0 text-brand-yellow-dark dark:text-brand-yellow"
                  />
                  <span>Facebook</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-black/10 pt-6 text-center text-xs text-muted dark:border-white/10">
          <p>
            © {new Date().getFullYear()} Tapicería Automotriz by NOVO. Todos los derechos reservados.
          </p>
          <p className="mt-2 flex justify-center gap-4">
            <Link href="/privacidad" className="hover:text-foreground hover:underline">
              Aviso de Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-foreground hover:underline">
              Términos y Condiciones
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
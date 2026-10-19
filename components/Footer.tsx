import { businessInfo } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { buildWhatsAppLink, formatWhatsApp } from "@/lib/constants/business";
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

  const heading = "font-display text-lg font-bold uppercase tracking-[0.08em] text-brand-yellow";
  const link = "inline-flex min-h-9 items-center text-[15px] text-[#e6e3dc] transition hover:text-brand-yellow";

  return (
    <footer className="bg-ink text-on-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-10 px-6 pt-14">
        <div className="min-w-0 flex-[1_1_260px]">
          <Link href="/" className="block w-fit">
            <p className="font-display text-[40px] font-extrabold uppercase leading-none">Novo</p>
            <p className="mt-1.5 text-[13px] uppercase tracking-[0.16em] text-on-ink-muted">
              Tapicería automotriz · Mérida
            </p>
          </Link>
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-[#d9d5cc]">
            Tapizado, restauración y personalización de interiores, hecho a mano.
          </p>
        </div>

        <div className="min-w-0 flex-[0_1_220px]">
          <p className={heading}>Horario</p>
          <p className="mt-3 text-[15px] leading-[1.8] text-[#d9d5cc]">
            Lun a vie · {settings.hoursWeekday}
            <br />
            Sábado · {settings.hoursSaturday}
            <br />
            Domingo · cerrado
          </p>
        </div>

        <div className="min-w-0 flex-[0_1_240px]">
          <p className={heading}>Visítanos</p>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-[15px] leading-relaxed text-[#d9d5cc] transition hover:text-brand-yellow"
          >
            {businessInfo.address}
          </a>
          <div className="mt-2 flex flex-wrap gap-x-5">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${link} font-semibold`}>
              WhatsApp · {formatWhatsApp(settings.whatsapp)}
            </a>
            <a href={businessInfo.facebook} target="_blank" rel="noopener noreferrer" className={`${link} gap-1.5 font-semibold`}>
              <FacebookIcon size={15} /> Facebook
            </a>
          </div>
        </div>

        <nav aria-label="Pie de página" className="min-w-0 flex-[0_1_160px]">
          <p className={heading}>Sitio</p>
          <ul className="mt-2">
            {[
              { href: "/servicios", label: "Servicios" },
              { href: "/galeria", label: "Galería" },
              { href: "/nosotros", label: "Nosotros" },
              { href: "/contacto", label: "Contacto" },
              { href: "/login", label: "Mi portal" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-10 max-w-6xl px-6">
        <div className="border-t-2 border-dashed border-brand-yellow/45" />
        <div className="flex flex-wrap justify-between gap-3 py-5 text-sm text-on-ink-muted">
          <span>© {new Date().getFullYear()} {businessInfo.name}</span>
          <span className="flex gap-5">
            <Link href="/privacidad" className="inline-flex min-h-9 items-center hover:text-brand-yellow">
              Aviso de privacidad
            </Link>
            <Link href="/terminos" className="inline-flex min-h-9 items-center hover:text-brand-yellow">
              Términos
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

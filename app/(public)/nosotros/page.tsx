import { businessInfo, buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | Tapicería Automotriz by NOVO",
};

const values = [
  {
    title: "Materiales de calidad",
    description:
      "Trabajamos con telas, pieles y materiales resistentes, pensados para durar en el uso diario del vehículo.",
  },
  {
    title: "Atención al detalle",
    description:
      "Cada costura y acabado se revisa con cuidado, porque un buen tapizado se nota en los detalles.",
  },
  {
    title: "Garantía en el trabajo",
    description:
      "Respaldamos cada servicio realizado, para que tengas la tranquilidad de un trabajo bien hecho.",
  },
];

export default async function NosotrosPage() {
  const settings = await getBusinessSettings();
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessInfo.address)}`;
  const whatsappHref = buildWhatsAppLink("Hola, quiero más información del taller.", settings.whatsapp);

  return (
    <div>
      {/* Encabezado */}
      <section className="relative overflow-hidden bg-ink text-on-ink">
        <Image
          src="/images/auth-background.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35 contrast-125 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink from-[5%] to-ink/60" />
        <div className="relative mx-auto max-w-6xl animate-fade-up px-6 pb-16 pt-20 sm:pb-20 sm:pt-24">
          <p className="font-display text-[15px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
            Nuestra historia
          </p>
          <h1 className="mt-3.5 max-w-3xl font-display text-6xl font-extrabold uppercase leading-[0.9] sm:text-[88px]">
            Cada costura, hecha a mano.
          </h1>
        </div>
      </section>

      {/* Historia */}
      <section className="mx-auto flex max-w-6xl flex-wrap gap-12 px-6 pb-6 pt-16 sm:pt-20">
        <div className="min-w-0 flex-[1_1_520px] animate-fade-up-on-scroll space-y-5 text-[17px] leading-[1.7] text-foreground/80">
          <p>
            En <span className="font-semibold text-foreground">Tapicería Automotriz by NOVO</span>{" "}
            nos dedicamos a la tapicería automotriz con un enfoque en la calidad y el detalle. Desde
            el tapizado de asientos hasta trabajos completos de interior, cada proyecto lo tratamos
            con el mismo cuidado, sin importar si se trata de un auto particular, una motocicleta o
            una embarcación.
          </p>
          <p>
            Nuestro taller está ubicado en {businessInfo.address}, donde recibimos vehículos de toda
            la ciudad para renovar y reparar su interior. Creemos que el tapizado no es solo
            estética: también es comodidad y durabilidad, y por eso ponemos atención en cada
            costura, cada material y cada acabado.
          </p>
          <p>
            Con el tiempo hemos ampliado nuestros servicios para cubrir prácticamente cualquier
            necesidad relacionada con tapicería vehicular: desde un simple cambio de alfombra, hasta
            la soldadura estructural de asientos dañados.
          </p>
        </div>
        <blockquote className="m-0 min-w-0 flex-[1_1_340px] self-start border-t-[3px] border-dashed border-brand-yellow-dark pt-6 dark:border-brand-yellow">
          <p className="font-display text-[44px] font-extrabold uppercase leading-[0.98] text-foreground">
            “Que tu vehículo se sienta como nuevo.”
          </p>
          <p className="mt-3.5 text-[15px] text-muted">Nuestro objetivo, desde el primer día</p>
        </blockquote>
      </section>

      {/* Valores */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[56px]">
          Lo que nos define
        </h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-3">
          {values.map((value, i) => (
            <article key={value.title} className="rounded-[18px] bg-surface p-7 dark:ring-1 dark:ring-white/5">
              <p className="font-display text-[56px] font-extrabold leading-none text-yellow-text">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3.5 font-display text-[28px] font-bold uppercase leading-none text-foreground">
                {value.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* El taller */}
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
        <div className="relative overflow-hidden rounded-[20px] bg-ink px-7 py-9 text-on-ink sm:px-10 dark:ring-1 dark:ring-white/10">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-brand-yellow">
            Visítanos
          </p>
          <p className="mt-2 font-display text-[44px] font-extrabold uppercase leading-[0.95]">El taller</p>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#d9d5cc]">{businessInfo.address}</p>
          <div className="mt-5 max-w-lg border-t-2 border-dashed border-brand-yellow/45" />
          <p className="mt-4 text-[15px] text-[#d9d5cc]">
            Lunes a viernes {settings.hoursWeekday} · Sábado {settings.hoursSaturday}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-yellow px-6 text-[15px] font-bold text-ink transition hover:bg-[#e8b90f]"
            >
              Cómo llegar
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-xl border-[1.5px] border-white/40 px-5 text-[15px] font-semibold text-white transition hover:bg-white/10"
            >
              WhatsApp
            </a>
            <Link
              href="/contacto"
              className="inline-flex min-h-12 items-center px-3 text-[15px] font-semibold text-brand-yellow hover:underline"
            >
              Contacto →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import { buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Award, Clock, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FAQSection } from "@/components/public/FAQSection";
import { WhatsAppLink } from "@/components/shared/WhatsAppLink";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: services }, settings, { data: reviews }, { data: galleryPreview }, { data: faqs }] =
    await Promise.all([
      supabase
        .from("services")
        .select("slug, title, short_description, image_url")
        .eq("is_active", true)
        .order("order", { ascending: true })
        .limit(3),
      getBusinessSettings(),
      supabase
        .from("reviews")
        .select("rating, comment, profiles!reviews_client_id_fkey(full_name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("gallery_items")
        .select("id, image_after_url, image_before_url, caption")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("faqs")
        .select("id, question, answer")
        .eq("is_active", true)
        .order("order", { ascending: true }),
    ]);

  const whatsappHref = buildWhatsAppLink(
    "Hola, me gustaría más información sobre sus servicios",
    settings.whatsapp,
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-on-ink">
        <div className="absolute inset-0">
          <Image
            src="/images/auth-background.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40 contrast-125 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        </div>

        <div className="relative mx-auto max-w-6xl animate-fade-up px-6 pb-20 pt-20 sm:pb-24 sm:pt-28">
          <p className="font-display text-[15px] font-semibold uppercase tracking-[0.2em] text-brand-yellow sm:text-base">
            Tapicería automotriz · Mérida
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-[52px] font-extrabold uppercase leading-[0.9] sm:text-7xl lg:text-[96px]">
            Pasión por el detalle, en cada vehículo.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#d9d5cc] sm:text-lg">
            Tapizado, restauración y personalización de interiores automotrices en Mérida,
            Yucatán. Materiales de calidad y seguimiento de tu pedido de principio a fin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/registro"
              className="inline-flex min-h-[52px] items-center rounded-xl bg-brand-yellow px-7 text-base font-bold text-ink transition hover:bg-[#e8b90f]"
            >
              Pedir cotización
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-[1.5px] border-white/40 px-6 text-base font-semibold text-white transition hover:border-white/70 hover:bg-white/10"
            >
              <MessageCircle size={18} /> Cotiza por WhatsApp
            </a>
          </div>
        </div>

        {/* Franja de confianza */}
        <div className="relative mx-6 border-t-2 border-dashed border-brand-yellow/50" />
        <ul className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 px-6 py-7 sm:grid-cols-4">
          {[
            { icon: Award, label: "Materiales de calidad" },
            { icon: ShieldCheck, label: "Trabajo garantizado" },
            { icon: Clock, label: "Seguimiento en línea" },
            { icon: Sparkles, label: "Hecho a mano" },
          ].map((item) => (
            <li key={item.label} className="flex items-center gap-2.5">
              <item.icon size={20} className="shrink-0 text-brand-yellow" aria-hidden="true" />
              <span className="font-display text-lg font-bold uppercase leading-tight tracking-[0.04em] sm:text-xl">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Servicios destacados */}
      <section className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6 py-20 sm:py-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[56px]">
              Nuestros servicios
            </h2>
            <p className="mt-2.5 text-[17px] text-muted">
              Tapicería automotriz para todo tipo de vehículo.
            </p>
          </div>
          <Link
            href="/servicios"
            className="inline-flex min-h-11 items-center gap-1.5 text-base font-semibold text-foreground hover:underline"
          >
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {services?.map((service) => (
            <Link
              key={service.slug}
              href={`/servicios/${service.slug}`}
              className="group block overflow-hidden rounded-[18px] bg-surface transition hover:-translate-y-0.5 hover:shadow-lg dark:ring-1 dark:ring-white/5"
            >
              <div className="relative h-44 bg-[#e6e2d9] dark:bg-[#2a2927]">
                {service.image_url ? (
                  <Image
                    src={service.image_url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="p-6">
                <h3 className="font-display text-[28px] font-bold uppercase leading-none text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                  {service.short_description}
                </p>
                <div className="mt-4 border-t-2 border-dashed border-seam" />
                <span className="mt-3.5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-foreground transition group-hover:gap-2.5">
                  Ver más <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Puente al portal: seguimiento en línea */}
      <section className="border-y-2 border-dashed border-seam bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6 py-20">
          <div className="min-w-0 flex-[1_1_380px] animate-fade-up-on-scroll">
            <p className="font-display text-[15px] font-semibold uppercase tracking-[0.18em] text-yellow-text">
              Nuevo
            </p>
            <h2 className="mt-2 font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[56px]">
              Ve en qué va tu coche, sin llamar.
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              Pide tu cotización en línea y sigue cada etapa: desmontaje, tapizado, montaje. Te
              avisamos cuando avanza.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/registro"
                className="inline-flex min-h-[52px] items-center rounded-xl bg-ink px-6 text-base font-semibold text-brand-yellow transition hover:bg-ink-soft dark:ring-1 dark:ring-white/10"
              >
                Crear mi cuenta
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[52px] items-center px-2 text-base font-semibold text-foreground hover:underline"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <figure
            aria-label="Ejemplo de un pedido en el portal"
            className="relative min-w-0 flex-[1_1_380px] rotate-[1.5deg] overflow-hidden rounded-[18px] bg-ink p-6 text-on-ink sm:p-7 dark:ring-1 dark:ring-white/10"
          >
            <span aria-hidden="true" className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface" />
            <span aria-hidden="true" className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-code text-[13px] text-on-ink-muted">FOLIO · INGRESÓ 12 OCT</p>
                <p className="mt-1.5 font-display text-[32px] font-extrabold uppercase leading-none sm:text-4xl">
                  Tu coche
                </p>
              </div>
              <span className="mt-1 inline-block -rotate-[5deg] rounded-lg border-2 border-brand-yellow px-3 py-1.5 font-display text-lg font-extrabold uppercase leading-none tracking-[0.06em] text-brand-yellow">
                En proceso
              </span>
            </div>
            <div className="mt-5 border-t-2 border-dashed border-brand-yellow/50" />
            <p className="mt-4 text-[15px] text-[#d9d5cc]">
              Tapizado de asientos · Etapa 2 de 4 ·{" "}
              <span className="font-semibold text-brand-yellow">Tapizado</span>
            </p>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              <div className="h-1.5 flex-1 rounded-full bg-brand-yellow" />
              <div className="h-1.5 flex-1 rounded-full bg-brand-yellow" />
              <div className="h-1.5 flex-1 rounded-full bg-[#3a3936]" />
              <div className="h-1.5 flex-1 rounded-full bg-[#3a3936]" />
            </div>
            <figcaption className="mt-4 text-sm text-on-ink-muted">
              Así se ve tu pedido en el portal
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6">
          <h2 className="mb-12 font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[56px]">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-[18px] bg-surface p-7 dark:ring-1 dark:ring-white/5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-brand-yellow">
                <Sparkles size={24} />
              </div>
              <h3 className="font-display text-2xl font-bold uppercase leading-none text-foreground">Atención personalizada</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                Cada vehículo es distinto, y así lo tratamos: revisamos tu caso
                a detalle antes de cotizar.
              </p>
            </div>
            <div className="rounded-[18px] bg-surface p-7 dark:ring-1 dark:ring-white/5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-brand-yellow">
                <Clock size={24} />
              </div>
              <h3 className="font-display text-2xl font-bold uppercase leading-none text-foreground">Seguimiento en línea</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                Da seguimiento a tu pedido paso a paso desde tu celular, sin
                tener que llamar para preguntar.
              </p>
            </div>
            <div className="rounded-[18px] bg-surface p-7 dark:ring-1 dark:ring-white/5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-brand-yellow">
                <Award size={24} />
              </div>
              <h3 className="font-display text-2xl font-bold uppercase leading-none text-foreground">Materiales de calidad</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                Trabajamos con piel, vinil y telas seleccionadas, pensadas para
                durar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vista previa de galería */}
      {galleryPreview && galleryPreview.length > 0 ? (
        <section className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[56px]">
                Trabajos recientes
              </h2>
              <p className="mt-2.5 text-[17px] text-muted">Antes y después de algunos proyectos.</p>
            </div>
            <Link
              href="/galeria"
              className="hidden min-h-11 shrink-0 items-center gap-1.5 text-base font-semibold text-foreground hover:underline sm:inline-flex"
            >
              Ver galería completa <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {galleryPreview.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-[#e6e2d9] dark:bg-[#2a2927]"
              >
                {item.image_after_url ? (
                  <img
                    src={item.image_after_url}
                    alt={item.caption ?? ""}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <Link
            href="/galeria"
            className="mt-6 flex min-h-11 items-center justify-center gap-1.5 text-base font-semibold text-foreground hover:underline sm:hidden"
          >
            Ver galería completa <ArrowRight size={16} />
          </Link>
        </section>
      ) : null}

      {/* Reseñas */}
      {reviews && reviews.length > 0 ? (
        <section className="border-t-2 border-dashed border-seam bg-surface py-20">
          <div className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6">
            <h2 className="mb-9 font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[56px]">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {reviews.map((r, i) => {
                const client = r.profiles as unknown as { full_name: string } | null;
                return (
                  <div
                    key={i}
                    className="rounded-[18px] bg-background p-6 dark:ring-1 dark:ring-white/5"
                  >
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={
                            star <= r.rating
                              ? "text-brand-yellow"
                              : "text-black/15 dark:text-white/15"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {r.comment ? (
                      <p className="mt-3 text-base leading-relaxed text-foreground/85">&quot;{r.comment}&quot;</p>
                    ) : null}
                    <p className="mt-4 font-display text-lg font-bold uppercase tracking-[0.04em] text-foreground">
                      {client?.full_name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <FAQSection faqs={faqs ?? []} />

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <div className="relative overflow-hidden rounded-[22px] bg-brand-yellow px-6 py-14 text-center text-ink sm:px-12">
          <span aria-hidden="true" className="pointer-events-none absolute inset-2.5 rounded-[15px] border-2 border-dashed border-ink/35" />
          <div className="relative animate-fade-up-on-scroll">
            <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-[64px]">
              ¿Listo para renovar tu interior?
            </h2>
            <p className="mx-auto mt-3.5 max-w-md text-[17px] text-[#2b2400]">
              Crea tu cuenta y pide tu cotización, o escríbenos directo por WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/registro"
                className="inline-flex min-h-[52px] items-center rounded-xl bg-ink px-7 text-base font-bold text-brand-yellow transition hover:bg-ink-soft"
              >
                Pedir cotización
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-[1.5px] border-ink px-6 text-base font-semibold text-ink transition hover:bg-ink/5"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
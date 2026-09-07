import { buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Award, Clock, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FAQSection } from "@/components/public/FAQSection";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: services }, settings, { data: reviews }, { data: galleryPreview }, { data: faqs }] =
    await Promise.all([
      supabase
        .from("services")
        .select("slug, title, short_description")
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
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/auth-background.jpg"
            alt=""
            fill
            priority
            className="object-cover grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/70 to-brand-black/40" />
        </div>

        <div className="mx-auto max-w-6xl animate-fade-up px-6 py-24">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-yellow">
            Tapicería Automotriz by NOVO
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Pasión por el detalle, en cada vehículo.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
            Tapizado, restauración y personalización de interiores automotrices
            en Mérida, Yucatán. Materiales de calidad, atención al detalle, y
            seguimiento de tu pedido de principio a fin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/servicios"
              className="rounded-md bg-brand-yellow px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-yellow-dark"
            >
              Ver servicios
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
            >
              <MessageCircle size={16} /> Cotiza por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Franja de confianza */}
      <section className="border-b border-black/10 bg-surface dark:border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
          {[
            { icon: Award, label: "Materiales de calidad" },
            { icon: ShieldCheck, label: "Trabajo garantizado" },
            { icon: Clock, label: "Seguimiento en línea" },
            { icon: Sparkles, label: "Atención al detalle" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 text-center">
              <item.icon size={22} className="text-brand-yellow-dark dark:text-brand-yellow" />
              <p className="text-xs font-medium text-foreground sm:text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Servicios destacados */}
      <section className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Nuestros servicios
            </h2>
            <p className="mt-2 text-muted">
              Tapicería automotriz para todo tipo de vehículo.
            </p>
          </div>
          <Link
            href="/servicios"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow sm:flex"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {services?.map((service) => (
            <Link
              key={service.slug}
              href={`/servicios/${service.slug}`}
              className="group rounded-lg border border-black/10 bg-surface p-6 shadow-sm transition hover:border-brand-yellow-dark hover:shadow-md dark:border-white/10 dark:hover:border-brand-yellow"
            >
              <h3 className="font-semibold text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm text-muted">{service.short_description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-yellow-dark transition group-hover:gap-2 dark:text-brand-yellow">
                Ver más <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/servicios"
          className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow sm:hidden"
        >
          Ver todos los servicios <ArrowRight size={14} />
        </Link>
      </section>

      {/* Por qué elegirnos */}
      <section className="border-t border-black/10 bg-surface py-20 dark:border-white/10">
        <div className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid gap-10 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow">
                <Sparkles size={24} />
              </div>
              <h3 className="font-semibold text-foreground">Atención personalizada</h3>
              <p className="mt-2 text-sm text-muted">
                Cada vehículo es distinto, y así lo tratamos: revisamos tu caso
                a detalle antes de cotizar.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow">
                <Clock size={24} />
              </div>
              <h3 className="font-semibold text-foreground">Seguimiento en línea</h3>
              <p className="mt-2 text-sm text-muted">
                Da seguimiento a tu pedido paso a paso desde tu celular, sin
                tener que llamar para preguntar.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow">
                <Award size={24} />
              </div>
              <h3 className="font-semibold text-foreground">Materiales de calidad</h3>
              <p className="mt-2 text-sm text-muted">
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
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Nuestro trabajo
              </h2>
              <p className="mt-2 text-muted">Antes y después de algunos proyectos recientes.</p>
            </div>
            <Link
              href="/galeria"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow sm:flex"
            >
              Ver galería completa <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {galleryPreview.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
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
            className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow sm:hidden"
          >
            Ver galería completa <ArrowRight size={14} />
          </Link>
        </section>
      ) : null}

      {/* Reseñas */}
      {reviews && reviews.length > 0 ? (
        <section className="border-t border-black/10 bg-surface py-16 dark:border-white/10">
          <div className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6">
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {reviews.map((r, i) => {
                const client = r.profiles as unknown as { full_name: string } | null;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
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
                      <p className="mt-3 text-sm text-muted">&quot;{r.comment}&quot;</p>
                    ) : null}
                    <p className="mt-3 text-sm font-medium text-foreground">
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
      <section className="border-t border-black/10 bg-surface dark:border-white/10">
        <div className="mx-auto max-w-6xl animate-fade-up-on-scroll px-6 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            ¿Listo para renovar tu interior?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Crea tu cuenta y solicita una cotización, o escríbenos directo por
            WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/registro"
              className="rounded-md bg-brand-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-brand-black dark:hover:bg-neutral-200"
            >
              Solicitar cotización
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-black/15 bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
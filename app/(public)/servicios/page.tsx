import { buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Servicios | Tapicería Automotriz by NOVO",
};

interface MaterialPreview {
  material_colors: { hex_color: string | null; is_active?: boolean }[] | null;
}

export default async function ServiciosPage() {
  const supabase = await createClient();
  const [{ data: services }, settings] = await Promise.all([
    supabase
      .from("services")
      .select("slug, title, short_description, image_url, material_types(material_colors(hex_color))")
      .eq("is_active", true)
      .order("order", { ascending: true }),
    getBusinessSettings(),
  ]);

  const whatsappHref = buildWhatsAppLink(
    "Hola, quiero preguntar por un servicio que no vi en la página.",
    settings.whatsapp,
  );

  function swatchesOf(materials: unknown) {
    const list = (materials as MaterialPreview[] | null) ?? [];
    const hexes = list
      .flatMap((m) => m.material_colors ?? [])
      .map((c) => c.hex_color)
      .filter((h): h is string => Boolean(h));
    return [...new Set(hexes)].slice(0, 6);
  }

  return (
    <div>
      {/* Encabezado */}
      <section className="bg-ink text-on-ink">
        <div className="mx-auto max-w-6xl animate-fade-up px-6 pb-12 pt-16 sm:pb-14 sm:pt-20">
          <p className="font-display text-[15px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
            Lo que hacemos
          </p>
          <h1 className="mt-3 font-display text-6xl font-extrabold uppercase leading-[0.9] sm:text-[88px]">
            Servicios
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[#d9d5cc] sm:text-lg">
            Tapicería automotriz con atención al detalle, para todo tipo de vehículo. Elige uno y
            ve sus materiales, colores y costuras.
          </p>
        </div>
        <div className="mx-6 border-t-2 border-dashed border-brand-yellow/50" />
        <ol className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2 px-6 py-5 text-[15px] text-[#d9d5cc]">
          {["Eliges servicio y material", "Te cotizamos sin compromiso", "Sigues tu coche en línea"].map(
            (step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="font-display text-[22px] font-extrabold text-brand-yellow">{i + 1}</span>
                {step}
              </li>
            ),
          )}
        </ol>
      </section>

      {/* Lista */}
      <section className="mx-auto max-w-6xl space-y-5 px-6 pb-10 pt-14 sm:pt-16">
        {services?.map((service, index) => {
          const swatches = swatchesOf(service.material_types);
          const reversed = index % 2 === 1;
          return (
            <Link
              key={service.slug}
              href={`/servicios/${service.slug}`}
              className={`group flex overflow-hidden rounded-[20px] bg-surface transition hover:shadow-lg dark:ring-1 dark:ring-white/5 ${
                reversed ? "flex-wrap-reverse sm:flex-row-reverse sm:flex-nowrap" : "flex-wrap sm:flex-nowrap"
              }`}
            >
              <div className="relative min-h-[220px] w-full bg-[#e6e2d9] sm:w-[46%] sm:shrink-0 dark:bg-[#2a2927]">
                {service.image_url ? (
                  <Image
                    src={service.image_url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 46vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center p-6 sm:p-9">
                <p className="font-display text-xl font-extrabold text-yellow-text">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-1.5 font-display text-4xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[44px]">
                  {service.title}
                </h2>
                {service.short_description ? (
                  <p className="mt-3 text-base leading-relaxed text-muted">{service.short_description}</p>
                ) : null}
                <div className="mt-5 border-t-2 border-dashed border-seam" />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {swatches.length > 0 ? (
                    <span className="flex gap-1.5" aria-hidden="true">
                      {swatches.map((hex) => (
                        <span
                          key={hex}
                          className="h-[22px] w-[22px] rounded-full ring-1 ring-black/10 dark:ring-white/15"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground transition group-hover:gap-2.5">
                    Ver materiales y colores <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* No ves lo que buscas */}
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-[20px] border-2 border-dashed border-brand-yellow-dark/50 bg-highlight px-6 py-7 sm:px-9 dark:border-brand-yellow/40">
          <div>
            <p className="font-display text-[32px] font-extrabold uppercase leading-none text-foreground">
              ¿No ves lo que buscas?
            </p>
            <p className="mt-2 text-base text-foreground/80">
              Motos, lanchas, consolas, alfombras… pregúntanos, seguro lo hacemos.
            </p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center rounded-xl bg-ink px-6 text-base font-semibold text-brand-yellow transition hover:bg-ink-soft dark:ring-1 dark:ring-white/10"
          >
            Preguntar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

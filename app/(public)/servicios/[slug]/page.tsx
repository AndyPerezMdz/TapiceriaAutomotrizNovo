import { StorageImage } from "@/components/shared/StorageImage";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: service } = await supabase
    .from("services")
    .select("title")
    .eq("slug", slug)
    .single();

  return {
    title: service ? `${service.title} | Tapicería Automotriz by NOVO` : "Servicio",
  };
}

interface SwatchColor {
  id: string;
  name: string;
  hex_color: string | null;
  image_url: string | null;
  requires_visit?: boolean | null;
}

function Swatches({ colors }: { colors: SwatchColor[] }) {
  if (colors.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-x-3.5 gap-y-4">
      {colors.map((c) => (
        <li key={c.id} className="flex w-[64px] flex-col items-center gap-1.5">
          <span
            className="relative block h-11 w-11 rounded-full bg-seam ring-1 ring-black/10 dark:ring-white/15"
            style={c.hex_color && !c.image_url ? { backgroundColor: c.hex_color } : undefined}
            title={c.requires_visit ? `${c.name}: requiere visita para igualar el tono` : c.name}
          >
            {c.image_url ? (
              <StorageImage src={c.image_url} alt="" fill sizes="44px" className="rounded-full object-cover" />
            ) : null}
            {c.requires_visit ? (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-yellow text-[11px] font-bold text-ink ring-2 ring-surface"
              >
                !
              </span>
            ) : null}
          </span>
          <span className="w-full truncate text-center text-[13px] text-foreground">
            {c.name}
            {c.requires_visit ? <span className="sr-only"> (requiere visita)</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function OptionCard({
  name,
  priceHint,
  imageUrl,
  colors,
}: {
  name: string;
  priceHint: string | null;
  imageUrl: string | null;
  colors: SwatchColor[];
}) {
  return (
    <article className="overflow-hidden rounded-[18px] bg-surface dark:ring-1 dark:ring-white/5">
      {imageUrl ? (
        <div className="relative h-[170px] bg-seam">
          <Image src={imageUrl} alt={name} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
      ) : null}
      <div className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-display text-[30px] font-bold uppercase leading-none text-foreground">{name}</h3>
          {priceHint ? (
            <span className="rounded-full bg-highlight px-3 py-1 text-sm font-semibold text-yellow-text">
              {priceHint}
            </span>
          ) : null}
        </div>
        {colors.length > 0 ? (
          <>
            <div className="mt-4 border-t-2 border-dashed border-seam" />
            <Swatches colors={colors} />
          </>
        ) : null}
      </div>
    </article>
  );
}

export default async function ServicioDetallePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data: service }, settings] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single(),
    getBusinessSettings(),
  ]);

  if (!service) {
    notFound();
  }

  const [{ data: materials }, { data: stitchings }] = await Promise.all([
    supabase
      .from("material_types")
      .select("id, name, price_hint, image_url, material_colors(id, name, hex_color, image_url, requires_visit)")
      .eq("service_id", service.id)
      .eq("is_active", true)
      .order("order", { ascending: true }),
    supabase
      .from("stitching_types")
      .select("id, name, price_hint, image_url, stitching_colors(id, name, hex_color, image_url)")
      .eq("service_id", service.id)
      .eq("is_active", true)
      .order("order", { ascending: true }),
  ]);

  const whatsappHref = buildWhatsAppLink(
    `Hola, me interesa el servicio de ${service.title}`,
    settings.whatsapp,
  );

  const quoteHref = `/portal/nuevo-pedido?service=${service.id}`;
  const anyVisit = (materials ?? []).some((m) =>
    ((m.material_colors as unknown as SwatchColor[]) ?? []).some((c) => c.requires_visit),
  );
  const h2 = "font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground";

  return (
    <div className="pb-20 sm:pb-24">
      <div className="mx-auto max-w-6xl px-6 pt-7">
        <Link
          href="/servicios"
          className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={18} /> Todos los servicios
        </Link>
      </div>

      <section className="mx-auto flex max-w-6xl flex-wrap items-start gap-7 px-6 pt-3">
        <div className="min-w-0 flex-[999_1_520px]">
          {service.image_url ? (
            <div className="relative h-64 overflow-hidden rounded-[20px] bg-seam sm:h-80">
              <Image src={service.image_url} alt="" fill priority sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
            </div>
          ) : null}
          <h1 className="mt-7 font-display text-5xl font-extrabold uppercase leading-[0.9] text-foreground sm:text-[76px]">
            {service.title}
          </h1>
          {service.full_description ? (
            <p className="mt-5 max-w-2xl whitespace-pre-line text-[17px] leading-relaxed text-foreground/80">
              {service.full_description}
            </p>
          ) : null}
        </div>

        {/* Vale de cotización */}
        <aside className="relative min-w-0 flex-[1_1_300px] overflow-hidden rounded-[20px] bg-brand-yellow p-7 text-ink lg:sticky lg:top-24">
          <span aria-hidden="true" className="pointer-events-none absolute inset-[9px] rounded-[13px] border-2 border-dashed border-ink/35" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.16em] text-[#3d3200]">Cotización sin compromiso</p>
            <p className="mt-2 font-display text-4xl font-extrabold uppercase leading-[0.95]">Cotiza este servicio</p>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[#2b2400]">
              Eliges material y color, mandas fotos y te respondemos con el precio.
            </p>
            <Link
              href={quoteHref}
              className="mt-5 flex min-h-[52px] items-center justify-center rounded-xl bg-ink text-base font-bold text-brand-yellow transition hover:bg-ink-soft"
            >
              Cotizar en línea
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 flex min-h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink text-[15px] font-semibold text-ink transition hover:bg-ink/5"
            >
              <MessageCircle size={17} /> Preguntar por WhatsApp
            </a>
          </div>
        </aside>
      </section>

      {materials && materials.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 pt-16 sm:pt-20">
          <h2 className={h2}>Materiales</h2>
          {anyVisit ? (
            <p className="mt-2 text-base text-muted">
              Los colores con <span className="font-bold text-foreground">!</span> necesitan una
              visita al taller para igualar el tono.
            </p>
          ) : null}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {materials.map((m) => (
              <OptionCard
                key={m.id}
                name={m.name}
                priceHint={m.price_hint}
                imageUrl={m.image_url}
                colors={(m.material_colors as unknown as SwatchColor[]) ?? []}
              />
            ))}
          </div>
        </section>
      ) : null}

      {stitchings && stitchings.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 pt-14 sm:pt-16">
          <h2 className={h2}>Costuras</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stitchings.map((st) => (
              <OptionCard
                key={st.id}
                name={st.name}
                priceHint={st.price_hint}
                imageUrl={st.image_url}
                colors={(st.stitching_colors as unknown as SwatchColor[]) ?? []}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 pt-14 sm:pt-16">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-[20px] bg-ink px-7 py-8 text-on-ink sm:px-10 dark:ring-1 dark:ring-white/10">
          <p className="font-display text-4xl font-extrabold uppercase leading-[0.95]">
            ¿Listo para cotizar {service.title.toLowerCase()}?
          </p>
          <Link
            href={quoteHref}
            className="inline-flex min-h-[52px] items-center rounded-xl bg-brand-yellow px-7 text-base font-bold text-ink transition hover:bg-[#e8b90f]"
          >
            Cotizar en línea
          </Link>
        </div>
      </section>
    </div>
  );
}

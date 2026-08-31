import { buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
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
}

function SwatchGrid({ colors }: { colors: SwatchColor[] }) {
  if (colors.length === 0) return null;
  return (
    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
      {colors.map((c) => (
        <div
          key={c.id}
          className="group overflow-hidden rounded-lg border border-black/10 bg-surface transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
        >
          <div className="aspect-square w-full">
            {c.image_url ? (
              <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
            ) : c.hex_color ? (
              <div className="h-full w-full" style={{ backgroundColor: c.hex_color }} />
            ) : (
              <div className="h-full w-full bg-black/5 dark:bg-white/5" />
            )}
          </div>
          <p className="truncate px-2 py-1.5 text-center text-xs font-medium text-foreground">
            {c.name}
          </p>
        </div>
      ))}
    </div>
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
      .select("id, name, price_hint, image_url, material_colors(id, name, hex_color, image_url)")
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/servicios"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a servicios
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {service.title}
      </h1>

      <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted">
        {service.full_description}
      </p>

      {/* CTA principal — cotizar en línea */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/portal/nuevo-pedido?service=${service.id}`}
          className="flex items-center gap-2 rounded-md bg-brand-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black dark:hover:bg-white/85"
        >
          <Sparkles size={16} /> Cotizar en línea
        </Link>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md border border-[#25D366]/30 bg-[#25D366]/10 px-6 py-3 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/20"
        >
          <MessageCircle size={16} /> Preguntar por WhatsApp
        </a>
      </div>

      {materials && materials.length > 0 ? (
        <div className="mt-14">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Materiales disponibles</h2>
          <div className="space-y-10">
            {materials.map((m) => {
              const colors = (m.material_colors as unknown as SwatchColor[]) ?? [];
              return (
                <div key={m.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                        className="h-44 w-full rounded-xl object-cover sm:w-44"
                      />
                    ) : null}
                    <div>
                      <p className="text-lg font-semibold text-foreground">{m.name}</p>
                      {m.price_hint ? (
                        <p className="text-sm text-muted">{m.price_hint}</p>
                      ) : null}
                    </div>
                  </div>
                  <SwatchGrid colors={colors} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {stitchings && stitchings.length > 0 ? (
        <div className="mt-14">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Costuras disponibles</h2>
          <div className="space-y-10">
            {stitchings.map((s) => {
              const colors = (s.stitching_colors as unknown as SwatchColor[]) ?? [];
              return (
                <div key={s.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.name}
                        className="h-44 w-full rounded-xl object-cover sm:w-44"
                      />
                    ) : null}
                    <div>
                      <p className="text-lg font-semibold text-foreground">{s.name}</p>
                      {s.price_hint ? (
                        <p className="text-sm text-muted">{s.price_hint}</p>
                      ) : null}
                    </div>
                  </div>
                  <SwatchGrid colors={colors} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-14 rounded-xl border border-black/10 bg-surface p-8 text-center dark:border-white/10">
        <p className="mb-4 text-lg font-semibold text-foreground">
          ¿Listo para renovar el interior de tu vehículo?
        </p>
        <Link
          href={`/portal/nuevo-pedido?service=${service.id}`}
          className="inline-flex items-center gap-2 rounded-md bg-brand-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black dark:hover:bg-white/85"
        >
          <Sparkles size={16} /> Cotizar {service.title.toLowerCase()} en línea
        </Link>
      </div>
    </div>
  );
}
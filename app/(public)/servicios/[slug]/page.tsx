import { buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
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

      {materials && materials.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-5 text-xl font-semibold text-foreground">Materiales disponibles</h2>
          <div className="space-y-8">
            {materials.map((m) => {
              const colors = (m.material_colors as unknown as {
                id: string;
                name: string;
                hex_color: string | null;
                image_url: string | null;
              }[]) ?? [];
              return (
                <div key={m.id}>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                        className="h-40 w-full rounded-lg object-cover sm:w-40"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold text-foreground">{m.name}</p>
                      {m.price_hint ? (
                        <p className="text-sm text-muted">{m.price_hint}</p>
                      ) : null}
                    </div>
                  </div>

                  {colors.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {colors.map((c) => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              className="h-8 w-8 rounded-full border border-black/10 object-cover dark:border-white/10"
                            />
                          ) : c.hex_color ? (
                            <span
                              className="h-6 w-6 rounded-full border border-black/10 dark:border-white/10"
                              style={{ backgroundColor: c.hex_color }}
                            />
                          ) : null}
                          <span className="text-xs text-muted">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {stitchings && stitchings.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-5 text-xl font-semibold text-foreground">Costuras disponibles</h2>
          <div className="space-y-8">
            {stitchings.map((s) => {
              const colors = (s.stitching_colors as unknown as {
                id: string;
                name: string;
                hex_color: string | null;
                image_url: string | null;
              }[]) ?? [];
              return (
                <div key={s.id}>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.name}
                        className="h-40 w-full rounded-lg object-cover sm:w-40"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      {s.price_hint ? (
                        <p className="text-sm text-muted">{s.price_hint}</p>
                      ) : null}
                    </div>
                  </div>

                  {colors.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {colors.map((c) => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              className="h-8 w-8 rounded-full border border-black/10 object-cover dark:border-white/10"
                            />
                          ) : c.hex_color ? (
                            <span
                              className="h-6 w-6 rounded-full border border-black/10 dark:border-white/10"
                              style={{ backgroundColor: c.hex_color }}
                            />
                          ) : null}
                          <span className="text-xs text-muted">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-block rounded-md bg-brand-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black dark:hover:bg-white/85"
      >
        Cotizar este servicio por WhatsApp
      </a>
    </div>
  );
}
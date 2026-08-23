import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Servicios | Tapicería Automotriz by NOVO",
};

export default async function ServiciosPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("slug, title, short_description, image_url")
    .eq("is_active", true)
    .order("order", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Nuestros servicios
        </h1>
        <p className="mt-3 text-muted">
          Tapicería automotriz con atención al detalle, para todo tipo de vehículo.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => (
          <Link
            key={service.slug}
            href={`/servicios/${service.slug}`}
            className="group rounded-lg border border-black/10 bg-surface p-6 shadow-sm transition hover:border-brand-yellow-dark hover:shadow-md dark:border-white/10 dark:hover:border-brand-yellow"
          >
            {service.image_url ? (
              <img
                src={service.image_url}
                alt=""
                className="mb-3 h-32 w-full rounded-md object-cover"
              />
            ) : null}
            <h2 className="font-semibold text-foreground">{service.title}</h2>
            <p className="mt-2 text-sm text-muted">{service.short_description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-yellow-dark transition group-hover:gap-2 dark:text-brand-yellow">
              Ver más <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
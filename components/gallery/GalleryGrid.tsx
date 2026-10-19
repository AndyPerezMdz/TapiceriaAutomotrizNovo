"use client";

import Image from "next/image";
import { BeforeAfter } from "@/components/gallery/BeforeAfter";
import { useMemo, useState } from "react";

interface Service {
  id: string;
  slug: string;
  title: string;
}

interface GalleryItem {
  id: string;
  service_id: string | null;
  image_before_url: string | null;
  image_after_url: string | null;
  caption: string | null;
}

export function GalleryGrid({
  services,
  items,
}: {
  services: Service[];
  items: GalleryItem[];
}) {
  const [activeFilter, setActiveFilter] = useState<string | "all">("all");

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.service_id === activeFilter);
  }, [items, activeFilter]);

  // Solo mostramos como filtro los servicios que sí tienen al menos una foto
  const availableServices = useMemo(() => {
    const usedServiceIds = new Set(items.map((i) => i.service_id));
    return services.filter((s) => usedServiceIds.has(s.id));
  }, [services, items]);

  const countFor = (id: string) => items.filter((i) => i.service_id === id).length;
  const titleFor = (id: string | null) => services.find((s) => s.id === id)?.title ?? null;

  if (items.length === 0) {
    return (
      <div className="rounded-[18px] border-2 border-dashed border-field-border bg-surface px-6 py-16 text-center">
        <p className="text-base text-muted">
          Muy pronto vas a poder ver aquí ejemplos de nuestros trabajos.
        </p>
      </div>
    );
  }

  const pill = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-[18px] text-[15px] transition ${
      active
        ? "bg-ink font-semibold text-brand-yellow dark:ring-1 dark:ring-white/10"
        : "border-[1.5px] border-field-border bg-surface text-foreground hover:border-foreground"
    }`;

  return (
    <div>
      {availableServices.length > 0 ? (
        <div role="group" aria-label="Filtrar por servicio" className="mb-8 flex flex-wrap gap-2">
          <button type="button" aria-pressed={activeFilter === "all"} onClick={() => setActiveFilter("all")} className={pill(activeFilter === "all")}>
            Todos · {items.length}
          </button>
          {availableServices.map((service) => (
            <button
              key={service.id}
              type="button"
              aria-pressed={activeFilter === service.id}
              onClick={() => setActiveFilter(service.id)}
              className={pill(activeFilter === service.id)}
            >
              {service.title} · {countFor(service.id)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        {filteredItems.map((item) => {
          const serviceTitle = titleFor(item.service_id);
          const single = item.image_after_url ?? item.image_before_url;
          return (
            <figure key={item.id} className="m-0 overflow-hidden rounded-[20px] bg-surface dark:ring-1 dark:ring-white/5">
              {item.image_before_url && item.image_after_url ? (
                <BeforeAfter before={item.image_before_url} after={item.image_after_url} caption={item.caption} />
              ) : single ? (
                <div className="relative aspect-[4/3] bg-seam">
                  <Image src={single} alt={item.caption ?? ""} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                  {item.image_after_url ? (
                    <span className="absolute right-3.5 top-3.5 -rotate-[5deg] rounded-[7px] border-2 border-brand-yellow bg-ink/70 px-2.5 py-1 font-display text-[15px] font-extrabold uppercase leading-none tracking-[0.06em] text-brand-yellow">
                      Terminado
                    </span>
                  ) : null}
                </div>
              ) : null}
              {item.caption || serviceTitle ? (
                <figcaption className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4 sm:px-6">
                  {item.caption ? (
                    <span className="font-display text-2xl font-bold uppercase leading-tight text-foreground">
                      {item.caption}
                    </span>
                  ) : (
                    <span />
                  )}
                  {serviceTitle ? <span className="text-sm text-muted">{serviceTitle}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>
    </div>
  );
}

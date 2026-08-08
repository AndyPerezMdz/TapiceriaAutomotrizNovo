"use client";

import Image from "next/image";
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

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
        <p className="text-muted">
          Muy pronto vas a poder ver aquí ejemplos de nuestros trabajos.
        </p>
      </div>
    );
  }

  return (
    <div>
      {availableServices.length > 0 ? (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === "all"
                ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
            }`}
          >
            Todos
          </button>
          {availableServices.map((service) => (
            <button
              key={service.id}
              onClick={() => setActiveFilter(service.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeFilter === service.id
                  ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                  : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
              }`}
            >
              {service.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm dark:border-white/10"
          >
            <div className="grid grid-cols-2 gap-0.5 bg-black/10 dark:bg-white/10">
              {item.image_before_url ? (
                <div className="relative aspect-square">
                  <Image
                    src={item.image_before_url}
                    alt="Antes"
                    fill
                    className="object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium uppercase text-white">
                    Antes
                  </span>
                </div>
              ) : null}
              {item.image_after_url ? (
                <div className="relative aspect-square">
                  <Image
                    src={item.image_after_url}
                    alt="Después"
                    fill
                    className="object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded bg-brand-yellow px-2 py-0.5 text-[11px] font-medium uppercase text-brand-black">
                    Después
                  </span>
                </div>
              ) : null}
            </div>
            {item.caption ? (
              <p className="p-4 text-sm text-muted">{item.caption}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
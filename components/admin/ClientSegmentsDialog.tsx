"use client";

import { Pill } from "@/components/taller";
import {
  audienceIncludes,
  audienceOptions,
  segmentLabels,
  type CouponAudience,
  type SegmentedClient,
} from "@/lib/coupons/audience";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  clients: SegmentedClient[];
  open: boolean;
  initialAudience?: CouponAudience;
  onClose: () => void;
}

const segmentTone: Record<string, string> = {
  nuevo: "bg-brand-yellow text-ink",
  no_frecuente: "border-[1.5px] border-dashed border-foreground text-foreground",
  frecuente: "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
};

/** Ventana con los clientes de cada categoría de cupón. */
export function ClientSegmentsDialog({ clients, open, initialAudience = "ambos", onClose }: Props) {
  const [audience, setAudience] = useState<CouponAudience>(initialAudience);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setAudience(initialAudience);
    setQuery("");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, initialAudience, onClose]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        audienceOptions.map((o) => [o.value, clients.filter((c) => audienceIncludes(o.value, c.segment)).length]),
      ) as Record<CouponAudience, number>,
    [clients],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(
      (c) =>
        audienceIncludes(audience, c.segment) &&
        (!q ||
          [c.full_name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [clients, audience, query]);

  if (!open) return null;

  const current = audienceOptions.find((o) => o.value === audience);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="segments-title"
        tabIndex={-1}
        className="animate-panel-in flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] bg-surface outline-none sm:rounded-[24px] dark:ring-1 dark:ring-white/10"
      >
        <div className="flex items-start justify-between gap-4 bg-ink px-5 pb-5 pt-6 text-on-ink sm:px-7">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-yellow">Cupones</p>
            <h2 id="segments-title" className="mt-1 font-display text-4xl font-extrabold uppercase leading-[0.95]">
              Clientes por categoría
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-ink-muted hover:bg-white/10 hover:text-on-ink"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 border-b-2 border-dashed border-seam px-5 py-4 sm:px-7">
          <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
            {audienceOptions.map((o) => (
              <Pill key={o.value} active={audience === o.value} onClick={() => setAudience(o.value)}>
                {o.short} · {counts[o.value]}
              </Pill>
            ))}
          </div>
          {current ? <p className="text-[0.9375rem] text-muted">{current.help}</p> : null}
          <label className="relative block">
            <span className="sr-only">Buscar cliente</span>
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono"
              className="block min-h-11 w-full rounded-[10px] border-[1.5px] border-field-border bg-field pl-10 pr-3.5 text-base text-foreground placeholder:text-muted/70 focus:border-foreground focus:outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 sm:px-4">
          {visible.length === 0 ? (
            <p className="px-3 py-10 text-center text-[0.9375rem] text-muted">
              {query ? "Nadie coincide con la búsqueda." : "No hay clientes en esta categoría todavía."}
            </p>
          ) : (
            <ul>
              {visible.map((c, i) => (
                <li key={c.id} className={i > 0 ? "border-t-2 border-dashed border-seam" : ""}>
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{c.full_name || "Sin nombre"}</p>
                      <p className="truncate text-[0.8125rem] text-muted">
                        {[c.email, c.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[0.8125rem] text-muted">
                        {c.orders_count} {c.orders_count === 1 ? "pedido" : "pedidos"} · {c.delivered_count} entregados
                      </span>
                      <span className={`rounded-md px-2 py-0.5 font-display text-sm font-bold uppercase ${segmentTone[c.segment]}`}>
                        {segmentLabels[c.segment]}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t-2 border-dashed border-seam px-5 py-3 text-[0.8125rem] text-muted sm:px-7">
          Mostrando {visible.length} de {counts[audience]} · Las categorías se calculan al momento con los pedidos de cada cliente.
        </p>
      </div>
    </div>
  );
}

import { Stamp, StageBar } from "@/components/taller";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export interface TicketService {
  id: string;
  title: string;
  stageCount: number;
  currentIndex: number;
  currentName: string | null;
}

interface Props {
  id: string;
  vehicle: string;
  createdAt: string;
  statusLabel: string;
  completed: boolean;
  hasUpdate: boolean;
  services: TicketService[];
}

/** Pedido activo en el inicio del portal, con forma de ticket del taller. */
export function ActiveOrderTicket({
  id,
  vehicle,
  createdAt,
  statusLabel,
  completed,
  hasUpdate,
  services,
}: Props) {
  const date = new Date(createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

  return (
    <Link
      href={`/portal/pedidos/${id}`}
      className="group relative block overflow-hidden rounded-[18px] bg-ink px-5 py-6 text-on-ink transition hover:-translate-y-0.5 sm:px-8 sm:py-7 dark:ring-1 dark:ring-white/10"
    >
      <span aria-hidden="true" className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
      <span aria-hidden="true" className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-code text-[13px] text-on-ink-muted">
            {id.slice(0, 8).toUpperCase()} · ingresó {date}
            {hasUpdate ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 font-taller text-[11px] font-semibold text-white">
                Novedades
              </span>
            ) : null}
          </p>
          <p className="mt-1.5 font-display text-[30px] font-extrabold uppercase leading-none sm:text-[40px]">
            {vehicle}
          </p>
        </div>
        <Stamp label={statusLabel} size="sm" className="mt-1 shrink-0 sm:hidden" />
        <Stamp label={statusLabel} size="md" className="mt-1 hidden shrink-0 sm:inline-block" />
      </div>

      {services.length > 0 ? (
        <>
          <div className="mt-5 border-t-2 border-dashed border-brand-yellow/50" />
          <div className="mt-5 space-y-4">
            {services.map((s) => (
              <div key={s.id}>
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-[15px]">
                  <span>{s.title}</span>
                  <span className="text-[#d9d5cc]">
                    {completed ? (
                      "Terminado"
                    ) : s.currentName ? (
                      <>
                        Etapa {s.currentIndex + 1} de {s.stageCount} ·{" "}
                        <span className="font-semibold text-brand-yellow">{s.currentName}</span>
                      </>
                    ) : (
                      "Aún no inicia"
                    )}
                  </span>
                </div>
                <StageBar
                  total={s.stageCount}
                  currentIndex={s.currentIndex}
                  completed={completed}
                  onInk
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      <p className="mt-5 flex items-center gap-1.5 text-[15px] font-semibold text-brand-yellow">
        Ver orden completa
        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

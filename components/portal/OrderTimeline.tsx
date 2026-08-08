import { CheckCircle2, Circle } from "lucide-react";

const statusLabels: Record<string, string> = {
  pendiente_revision: "Pendiente de revisión",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  en_proceso: "En proceso",
  listo_para_entrega: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

interface HistoryEntry {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export function OrderTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="space-y-0">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        const date = new Date(entry.created_at).toLocaleString("es-MX", {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <div key={entry.id} className="relative flex gap-3 pb-6">
            {!isLast ? (
              <div className="absolute left-[9px] top-5 h-full w-px bg-black/10 dark:bg-white/10" />
            ) : null}

            {isLast ? (
              <CheckCircle2
                size={20}
                className="shrink-0 text-brand-yellow-dark dark:text-brand-yellow"
              />
            ) : (
              <Circle size={20} className="shrink-0 text-muted" />
            )}

            <div>
              <p className="font-medium text-foreground">
                {statusLabels[entry.status] ?? entry.status}
              </p>
              <p className="text-xs text-muted">{date}</p>
              {entry.note ? (
                <p className="mt-1 text-sm text-muted">{entry.note}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
const styles: Record<string, string> = {
  pendiente_revision: "bg-brand-red-dark text-white",
  cotizado: "border-[1.5px] border-dashed border-foreground text-foreground",
  aprobado: "border-[1.5px] border-foreground text-foreground",
  rechazado: "border-[1.5px] border-muted text-muted line-through",
  en_proceso: "bg-brand-yellow text-ink",
  listo_para_entrega: "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
  entregado: "border-[1.5px] border-muted text-muted",
  cancelado: "border-[1.5px] border-muted text-muted line-through",
};

const labels: Record<string, string> = {
  pendiente_revision: "Por revisar",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  en_proceso: "En proceso",
  listo_para_entrega: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Etiqueta de estado compacta para listas y tablas. */
export function StatusTag({ status, deleted = false }: { status: string; deleted?: boolean }) {
  const cls = deleted
    ? "border-[1.5px] border-brand-red-dark text-brand-red-dark line-through dark:border-brand-red dark:text-brand-red"
    : styles[status] ?? "border-[1.5px] border-muted text-muted";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${cls}`}
    >
      {deleted ? "Eliminado" : labels[status] ?? status}
    </span>
  );
}

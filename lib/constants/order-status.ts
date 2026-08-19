export const statusLabels: Record<string, string> = {
  pendiente_revision: "Pendiente de revisión",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  en_proceso: "En proceso",
  listo_para_entrega: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const statusColors: Record<string, string> = {
  pendiente_revision:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  cotizado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  aprobado:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  rechazado: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  en_proceso: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  listo_para_entrega:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  entregado: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export const deletedBadgeClass =
  "bg-red-100 text-red-700 line-through dark:bg-red-950/40 dark:text-red-400";
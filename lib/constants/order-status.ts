import { orderStatusTone, statusTone } from "@/lib/constants/status-colors";

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

export const statusColors: Record<string, string> = Object.fromEntries(
  Object.entries(orderStatusTone).map(([status, tone]) => [status, statusTone[tone]]),
);

export const deletedBadgeClass =
  "bg-red-100 text-red-700 line-through dark:bg-red-950/40 dark:text-red-400";
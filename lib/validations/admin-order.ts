import { z } from "zod";

export const orderStatusValues = [
  "pendiente_revision",
  "cotizado",
  "aprobado",
  "rechazado",
  "en_proceso",
  "listo_para_entrega",
  "entregado",
  "cancelado",
] as const;

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
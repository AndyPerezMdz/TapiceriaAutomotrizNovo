// Paleta de colores de estado, unificada en todo el sistema.
// Gris = neutro/espera · Azul = en progreso · Verde = completado/bueno · Rojo = cancelado/problema

export const statusTone = {
  neutral: "border-[1.5px] border-muted text-muted",
  progress: "bg-brand-yellow text-ink",
  success: "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
  danger: "border-[1.5px] border-brand-red-dark text-brand-red-dark dark:border-brand-red dark:text-brand-red",
} as const;

export type StatusTone = keyof typeof statusTone;

// Pedidos
export const orderStatusTone: Record<string, StatusTone> = {
  pendiente_revision: "neutral",
  cotizado: "progress",
  aprobado: "progress",
  en_proceso: "progress",
  listo_para_entrega: "progress",
  entregado: "success",
  rechazado: "danger",
  cancelado: "danger",
};

// Citas
export const appointmentStatusTone: Record<string, StatusTone> = {
  pendiente: "neutral",
  confirmada: "progress",
  completada: "success",
  cancelada: "danger",
};

// Quejas
export const complaintStatusTone: Record<string, StatusTone> = {
  abierta: "neutral",
  atendida: "progress",
  cerrada: "success",
};

// Contactos
export const contactStatusTone: Record<string, StatusTone> = {
  nuevo: "neutral",
  contactado: "progress",
  cerrado: "success",
};

// Activo/inactivo (cupones, usuarios)
export const activeStateTone = {
  active: statusTone.success,
  inactive: statusTone.neutral,
};
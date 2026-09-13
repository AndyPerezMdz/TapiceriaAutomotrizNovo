// Paleta de colores de estado, unificada en todo el sistema.
// Gris = neutro/espera · Azul = en progreso · Verde = completado/bueno · Rojo = cancelado/problema

export const statusTone = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
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
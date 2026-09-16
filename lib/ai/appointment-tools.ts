import { getSlotsForDate, formatDateKey } from "@/lib/constants/appointments";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FunctionDeclaration } from "@/lib/ai/gemini";

export const appointmentFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: "consultar_horarios_disponibles",
    description:
      "Busca los horarios de cita disponibles para una fecha específica. Úsala SIEMPRE antes de agendar una cita, para confirmar que el horario que pide el cliente esté libre, o para ofrecerle opciones si no lo está.",
    parameters: {
      type: "object" as const,
      properties: {
        fecha: {
          type: "string",
          description: "Fecha a consultar, en formato YYYY-MM-DD.",
        },
      },
      required: ["fecha"],
    },
  },
  {
    name: "agendar_cita",
    description:
      "Crea una cita nueva para el cliente, en estado pendiente de confirmar. Solo úsala DESPUÉS de haber confirmado con consultar_horarios_disponibles que el horario está libre, y de que el cliente haya confirmado la fecha, hora y motivo exactos.",
    parameters: {
      type: "object" as const,
      properties: {
        fecha: {
          type: "string",
          description: "Fecha de la cita, en formato YYYY-MM-DD.",
        },
        hora: {
          type: "string",
          description: "Hora exacta de la cita, tal como aparece en los horarios disponibles (ej. '11:00').",
        },
        motivo: {
          type: "string",
          description: "Motivo de la visita, descrito brevemente por el cliente.",
        },
      },
      required: ["fecha", "hora", "motivo"],
    },
  },
];

export async function consultarHorariosDisponibles(fecha: string) {
  const date = new Date(`${fecha}T00:00:00`);
  const allSlots = getSlotsForDate(date);

  if (allSlots.length === 0) {
    return { disponibles: [], mensaje: "El taller no atiende citas ese día (domingo)." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("appointments")
    .select("appointment_time")
    .eq("appointment_date", fecha)
    .neq("status", "cancelada");

  const ocupados = new Set((existing ?? []).map((a) => a.appointment_time));
  const disponibles = allSlots.filter((slot) => !ocupados.has(slot));

  return { disponibles, mensaje: disponibles.length === 0 ? "No hay horarios libres ese día." : "" };
}

export async function crearCitaDesdeChat(params: {
  fecha: string;
  hora: string;
  motivo: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
}) {
  const { disponibles } = await consultarHorariosDisponibles(params.fecha);

  if (!disponibles.includes(params.hora)) {
    return { success: false, mensaje: "Ese horario ya no está disponible. Por favor elige otro." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("appointments").insert({
    client_id: params.clientId,
    client_name: params.clientName,
    client_phone: params.clientPhone ?? "No proporcionado",
    appointment_date: params.fecha,
    appointment_time: params.hora,
    reason: params.motivo,
    status: "pendiente",
  });

  if (error) {
    console.error("Error creando cita desde chat:", error);
    return { success: false, mensaje: "No se pudo crear la cita. Intenta de nuevo." };
  }

  return { success: true, mensaje: "Cita creada correctamente." };
}
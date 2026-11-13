import type { SupabaseClient } from "@supabase/supabase-js";

export interface CalendarAvailability {
  blockedDates: string[];
  /** Horarios ocupados por día ("2026-11-18": ["9:30", "11:00"]). */
  takenSlots: Record<string, string[]>;
}

/** Días bloqueados y horarios ya ocupados de las próximas semanas. */
export async function getCalendarAvailability(supabase: SupabaseClient, days = 25): Promise<CalendarAvailability> {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);

  const [{ data: blocked }, { data: existing }] = await Promise.all([
    supabase.from("blocked_dates").select("blocked_date").gte("blocked_date", from).lte("blocked_date", to),
    supabase
      .from("appointments")
      .select("appointment_date, appointment_time")
      .neq("status", "cancelada")
      .gte("appointment_date", from)
      .lte("appointment_date", to),
  ]);

  const takenSlots: Record<string, string[]> = {};
  for (const a of existing ?? []) {
    (takenSlots[a.appointment_date] ??= []).push(a.appointment_time);
  }
  return { blockedDates: blocked?.map((b) => b.blocked_date) ?? [], takenSlots };
}

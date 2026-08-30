export const WEEKDAY_SLOTS = ["9:30", "11:00", "12:30", "14:00", "15:30"];
export const SATURDAY_SLOTS = ["9:30", "11:00", "12:30"];

export function getSlotsForDate(date: Date): string[] {
  const day = date.getDay(); // 0 = Domingo, 6 = Sábado
  if (day === 0) return [];
  if (day === 6) return SATURDAY_SLOTS;
  return WEEKDAY_SLOTS;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
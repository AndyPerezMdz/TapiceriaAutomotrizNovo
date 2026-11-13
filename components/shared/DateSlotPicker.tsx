"use client";

import { formatDateKey, getSlotsForDate } from "@/lib/constants/appointments";
import type { CalendarAvailability } from "@/lib/data/calendar";
import { useMemo } from "react";

interface Props extends CalendarAvailability {
  date: string | null;
  slot: string | null;
  onChange: (date: string | null, slot: string | null) => void;
  /** Tono del fondo donde se pinta (tarjeta clara u orden negra). */
  tone?: "light" | "ink";
}

/** Elegir día (próximas 3 semanas, sin domingos ni días bloqueados) y hora. */
export function DateSlotPicker({ blockedDates, takenSlots, date, slot, onChange, tone = "light" }: Props) {
  const days = useMemo(() => {
    const list: { key: string; label: string; date: Date }[] = [];
    const today = new Date();
    for (let i = 1; i <= 21 && list.length < 12; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = formatDateKey(d);
      if (d.getDay() === 0 || blockedDates.includes(key)) continue;
      list.push({ key, label: d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }), date: d });
    }
    return list;
  }, [blockedDates]);

  const slots = useMemo(() => {
    const day = days.find((d) => d.key === date)?.date;
    if (!day) return [];
    const taken = takenSlots[date ?? ""] ?? [];
    return getSlotsForDate(day).filter((s) => !taken.includes(s));
  }, [date, days, takenSlots]);

  const off =
    tone === "ink"
      ? "border-white/25 text-on-ink hover:border-white/60"
      : "border-field-border bg-surface text-foreground hover:border-foreground";
  const on = "border-brand-yellow bg-brand-yellow font-semibold text-ink";
  const chip = "min-h-11 rounded-xl border-[1.5px] px-3 text-[0.9375rem] transition";

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-[0.9375rem] font-semibold">Día</legend>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d.key}
              type="button"
              aria-pressed={date === d.key}
              onClick={() => onChange(d.key, null)}
              className={`${chip} capitalize ${date === d.key ? on : off}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>
      {date ? (
        <fieldset>
          <legend className="mb-2 text-[0.9375rem] font-semibold">Hora</legend>
          {slots.length === 0 ? (
            <p className="text-[0.9375rem] opacity-75">Ese día ya no hay horarios libres. Elige otro.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={slot === s}
                  onClick={() => onChange(date, s)}
                  className={`${chip} ${slot === s ? on : off}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      ) : null}
    </div>
  );
}

/** "martes 18 de noviembre, 11:00" */
export function formatDropoff(date: string, time: string) {
  const label = new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${label}, ${time}`;
}

"use client";

import { formatDateKey, getSlotsForDate } from "@/lib/constants/appointments";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Check } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  clientName: string;
  clientPhone: string;
  orderId: string | null;
  blockedDates: string[];
  takenSlots: Record<string, string[]>;
}

export function AppointmentBooking({
  clientName,
  clientPhone,
  orderId,
  blockedDates,
  takenSlots,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const availableDays = useMemo(() => {
    const days: { key: string; label: string; date: Date }[] = [];
    const today = new Date();
    for (let i = 1; i <= 21 && days.length < 12; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = formatDateKey(d);
      if (d.getDay() === 0) continue;
      if (blockedDates.includes(key)) continue;
      days.push({
        key,
        label: d.toLocaleDateString("es-MX", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        date: d,
      });
    }
    return days;
  }, [blockedDates]);

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const day = availableDays.find((d) => d.key === selectedDate)?.date;
    if (!day) return [];
    const allSlots = getSlotsForDate(day);
    const taken = takenSlots[selectedDate] ?? [];
    return allSlots.filter((s) => !taken.includes(s));
  }, [selectedDate, availableDays, takenSlots]);

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot) return;

    setIsSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      client_id: user.id,
      order_id: orderId,
      client_name: clientName,
      client_phone: clientPhone,
      appointment_date: selectedDate,
      appointment_time: selectedSlot,
    });

    if (insertError) {
      setError("No se pudo agendar la cita. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    setSuccess(true);
    setIsSaving(false);
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6 text-center">
        <Check size={28} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
        <p className="font-medium text-foreground">¡Cita agendada!</p>
        <p className="mt-1 text-sm text-muted">
          Te esperamos el{" "}
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          a las {selectedSlot}. Si necesitas reagendar, contáctanos por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Calendar size={16} /> Agenda tu visita al taller
      </h2>

      {error ? (
        <div className="mb-3 rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      <p className="mb-2 text-xs font-medium text-muted">Elige un día</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {availableDays.map((d) => (
          <button
            key={d.key}
            onClick={() => {
              setSelectedDate(d.key);
              setSelectedSlot(null);
            }}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition ${
              selectedDate === d.key
                ? "border-brand-black bg-black/5 dark:border-white dark:bg-white/10"
                : "border-black/15 text-muted hover:border-black/30 dark:border-white/15"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {selectedDate ? (
        <>
          <p className="mb-2 text-xs font-medium text-muted">Elige un horario</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {slotsForSelectedDay.length === 0 ? (
              <p className="text-xs text-muted">No hay horarios disponibles ese día.</p>
            ) : (
              slotsForSelectedDay.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    selectedSlot === slot
                      ? "border-brand-black bg-black/5 dark:border-white dark:bg-white/10"
                      : "border-black/15 text-muted hover:border-black/30 dark:border-white/15"
                  }`}
                >
                  {slot}
                </button>
              ))
            )}
          </div>
        </>
      ) : null}

      <button
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedSlot || isSaving}
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Agendando..." : "Confirmar cita"}
      </button>
    </div>
  );
}
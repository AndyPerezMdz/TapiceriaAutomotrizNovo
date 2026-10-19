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
  const [reason, setReason] = useState("");
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
      reason: reason.trim() || null,
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
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <Check size={28} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
        <p className="font-medium text-foreground">¡Cita agendada!</p>
        <p className="mt-1 text-[15px] text-muted">
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
    <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      <h2 className="font-display text-2xl font-bold uppercase mb-4 flex items-center gap-1.5 text-foreground">
        <Calendar size={16} /> Agenda tu visita al taller
      </h2>

      {error ? (
        <div className="mb-3 rounded-xl border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-[15px] text-brand-red">
          {error}
        </div>
      ) : null}

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-medium text-muted">
          ¿Cuál es el motivo de tu visita?
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Ej. Quiero cotizar piel color café para los asientos de mi Nissan Versa"
          className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
        />
      </div>
      
      <p className="mb-2.5 text-[15px] font-semibold text-foreground">Elige un día</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {availableDays.map((d) => (
          <button
            key={d.key}
            onClick={() => {
              setSelectedDate(d.key);
              setSelectedSlot(null);
            }}
            type="button"
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] capitalize transition ${
              selectedDate === d.key
                ? "bg-ink font-semibold text-brand-yellow dark:ring-1 dark:ring-white/10"
                : "border-[1.5px] border-field-border bg-surface text-foreground hover:border-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {selectedDate ? (
        <>
          <p className="mb-2.5 text-[15px] font-semibold text-foreground">Elige un horario</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {slotsForSelectedDay.length === 0 ? (
              <p className="text-[13px] text-muted">No hay horarios disponibles ese día.</p>
            ) : (
              slotsForSelectedDay.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  type="button"
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] transition ${
                    selectedSlot === slot
                      ? "bg-ink font-semibold text-brand-yellow dark:ring-1 dark:ring-white/10"
                      : "border-[1.5px] border-field-border bg-surface text-foreground hover:border-foreground"
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
        className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-50 min-h-11 inline-flex items-center justify-center"
      >
        {isSaving ? "Agendando..." : "Confirmar cita"}
      </button>
    </div>
  );
}
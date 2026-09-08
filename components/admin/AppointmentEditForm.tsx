"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

export function AppointmentEditForm({
  id,
  currentDate,
  currentTime,
  onClose,
}: {
  id: string;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const supabase = createClient();
    await supabase
      .from("appointments")
      .update({ appointment_date: date, appointment_time: time })
      .eq("id", id);
    setIsSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-black/10 bg-surface p-5 shadow-2xl dark:border-white/10"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-foreground">Editar cita</p>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClassName}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-4 w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
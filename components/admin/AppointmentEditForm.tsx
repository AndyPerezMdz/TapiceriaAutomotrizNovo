"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";

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
        className="w-full max-w-sm rounded-2xl bg-surface p-5 sm:p-7 shadow-2xl dark:ring-1 dark:ring-white/5"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-foreground">Editar cita</p>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[13px] text-muted">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClassName}
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-muted">Hora</label>
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
          className="mt-4 w-full rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-4 py-2.5 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
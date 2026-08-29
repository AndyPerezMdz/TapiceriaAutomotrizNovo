"use client";

import { createClient } from "@/lib/supabase/client";
import type { BusinessSettings } from "@/lib/data/business-settings";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";
const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

export function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [hoursWeekday, setHoursWeekday] = useState(settings.hoursWeekday);
  const [hoursSaturday, setHoursSaturday] = useState(settings.hoursSaturday);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanPhone = whatsapp.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("El número de WhatsApp debe tener 10 dígitos.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("business_settings")
      .update({
        whatsapp: cleanPhone,
        hours_weekday: hoursWeekday.trim(),
        hours_saturday: hoursSaturday.trim(),
      })
      .eq("id", 1);

    if (updateError) {
      setError("No se pudo guardar. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    setSuccess(true);
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {error ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
          Configuración actualizada correctamente.
        </div>
      ) : null}

      <div>
        <label htmlFor="whatsapp" className={labelClassName}>
          Número de WhatsApp (10 dígitos)
        </label>
        <input
          id="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="numeric"
          placeholder="9998024783"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div>
        <label htmlFor="hoursWeekday" className={labelClassName}>
          Horario Lunes a Viernes
        </label>
        <input
          id="hoursWeekday"
          value={hoursWeekday}
          onChange={(e) => setHoursWeekday(e.target.value)}
          placeholder="9:30 am – 5:00 pm"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div>
        <label htmlFor="hoursSaturday" className={labelClassName}>
          Horario Sábado
        </label>
        <input
          id="hoursSaturday"
          value={hoursSaturday}
          onChange={(e) => setHoursSaturday(e.target.value)}
          placeholder="9:30 am – 3:00 pm"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
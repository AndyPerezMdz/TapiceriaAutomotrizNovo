"use client";

import { createClient } from "@/lib/supabase/client";
import type { BusinessSettings } from "@/lib/data/business-settings";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";
const labelClassName = "mb-1.5 block text-[15px] font-medium text-foreground";

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
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-[15px] text-brand-red">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-[15px] text-green-700 dark:text-green-400">
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
        className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
      >
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
"use client";

import { useToast } from "@/components/shared/ToastProvider";
import { applyA11yPrefs, type A11yPrefs, type UiMode } from "@/lib/a11y/preferences";
import { createClient } from "@/lib/supabase/client";
import { LayoutGrid, MousePointerClick } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Se muestra una sola vez: el cliente elige entre la vista completa y la sencilla. */
export function ModeChooser({ current }: { current: A11yPrefs }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState<UiMode | null>(null);

  async function choose(mode: UiMode) {
    setSaving(mode);
    const textSize = mode === "sencillo" && current.textSize === "normal" ? "grande" : current.textSize;
    applyA11yPrefs({ textSize, highContrast: current.highContrast, reduceMotion: current.reduceMotion });
    const supabase = createClient();
    const { error } = await supabase.rpc("set_ui_preferences", {
      p_ui_mode: mode,
      p_text_size: textSize,
      p_high_contrast: current.highContrast,
      p_reduce_motion: current.reduceMotion,
    });
    if (error) {
      setSaving(null);
      showToast("No se pudo guardar tu elección. Intenta de nuevo.", "error");
      return;
    }
    router.refresh();
  }

  const card =
    "group flex w-full flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition disabled:opacity-60 sm:p-6";

  return (
    <section className="rounded-[20px] bg-ink p-5 text-on-ink sm:p-8 dark:ring-1 dark:ring-white/10">
      <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-yellow">Antes de empezar</p>
      <h2 className="mt-1.5 font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl">
        ¿Cómo quieres ver tu portal?
      </h2>
      <p className="mt-2 text-[1.0625rem] text-[#d9d5cc]">Puedes cambiarlo cuando quieras en Mi perfil → Accesibilidad.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => choose("sencillo")}
          className={`${card} border-brand-yellow bg-brand-yellow text-ink hover:bg-[#e8b90f]`}
        >
          <MousePointerClick size={30} />
          <span className="font-display text-[2rem] font-extrabold uppercase leading-none">Sencilla</span>
          <span className="text-[1.0625rem]">Letra grande, botones grandes y solo lo importante.</span>
          <span className="mt-1 text-[0.9375rem] font-bold underline underline-offset-4">
            {saving === "sencillo" ? "Guardando…" : "Quiero esta"}
          </span>
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => choose("normal")}
          className={`${card} border-white/25 hover:border-white/60`}
        >
          <LayoutGrid size={30} className="text-brand-yellow" />
          <span className="font-display text-[2rem] font-extrabold uppercase leading-none">Completa</span>
          <span className="text-[1.0625rem] text-[#d9d5cc]">Todo a la mano: etapas, cupones, puntos y referidos.</span>
          <span className="mt-1 text-[0.9375rem] font-bold text-brand-yellow underline underline-offset-4">
            {saving === "normal" ? "Guardando…" : "Quiero esta"}
          </span>
        </button>
      </div>
    </section>
  );
}

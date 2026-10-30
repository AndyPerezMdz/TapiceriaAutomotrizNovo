"use client";

import { ModePreview } from "@/components/a11y/ModePreview";
import { useToast } from "@/components/shared/ToastProvider";
import { applyA11yPrefs, type A11yPrefs, type UiMode } from "@/lib/a11y/preferences";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DISMISS_KEY = "novo-mode-chooser-later";

/**
 * Modal que aparece una sola vez para que el cliente elija entre la vista
 * completa y la sencilla. "Ahora no" lo esconde solo durante esta visita.
 */
export function ModeChooser({ current }: { current: A11yPrefs }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<UiMode | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Se abre en el cliente (respeta el "Ahora no" de esta sesión).
  useEffect(() => {
    let later = false;
    try {
      later = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // sin almacenamiento: se muestra igual
    }
    if (!later) setOpen(true);
  }, []);

  // Bloquea el scroll del fondo, enfoca el modal y cierra con Escape.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") later();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function later() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // nada
    }
    setOpen(false);
  }

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
    setOpen(false);
    router.refresh();
  }

  if (!open) return null;

  const card =
    "flex w-full flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition disabled:opacity-60 sm:p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-chooser-title"
        tabIndex={-1}
        className="animate-panel-in max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[24px] bg-ink p-5 text-on-ink outline-none sm:rounded-[24px] sm:p-8 dark:ring-1 dark:ring-white/10"
      >
        <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-yellow">Bienvenido a tu portal</p>
        <h2 id="mode-chooser-title" className="mt-1.5 font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl">
          ¿Cómo quieres verlo?
        </h2>
        <p className="mt-2 text-[1.0625rem] text-[#d9d5cc]">
          Elige la que te acomode. Puedes cambiarla cuando quieras en Mi perfil → Accesibilidad.
        </p>
        <div className="mt-3 border-t-2 border-dashed border-brand-yellow/40" />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => choose("sencillo")}
            className={`${card} border-brand-yellow bg-brand-yellow text-ink hover:bg-[#e8b90f]`}
          >
            <ModePreview mode="sencillo" />
            <span className="font-display text-[2rem] font-extrabold uppercase leading-none">Sencilla</span>
            <span className="text-[1.0625rem]">Letra grande, botones grandes y solo lo importante.</span>
            <span className="mt-auto inline-flex min-h-12 items-center rounded-xl bg-ink px-4 text-[1rem] font-bold text-brand-yellow">
              {saving === "sencillo" ? "Guardando…" : "Quiero esta"}
            </span>
          </button>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => choose("normal")}
            className={`${card} border-white/25 hover:border-white/60`}
          >
            <ModePreview mode="normal" />
            <span className="font-display text-[2rem] font-extrabold uppercase leading-none">Completa</span>
            <span className="text-[1.0625rem] text-[#d9d5cc]">Todo a la mano: etapas, cupones, puntos y referidos.</span>
            <span className="mt-auto inline-flex min-h-12 items-center rounded-xl border-[1.5px] border-brand-yellow px-4 text-[1rem] font-bold text-brand-yellow">
              {saving === "normal" ? "Guardando…" : "Quiero esta"}
            </span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={later}
            disabled={saving !== null}
            className="inline-flex min-h-11 items-center px-3 text-[0.9375rem] text-on-ink-muted underline-offset-4 hover:text-on-ink hover:underline"
          >
            Ahora no, decido después
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useToast } from "@/components/shared/ToastProvider";
import { applyA11yPrefs, textSizeLabels, type A11yPrefs, type TextSize, type UiMode } from "@/lib/a11y/preferences";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  initial: A11yPrefs;
  /** El modo sencillo solo existe en el portal del cliente. */
  showMode?: boolean;
}

const sizes: TextSize[] = ["normal", "grande", "extra"];
const sizePreview: Record<TextSize, string> = {
  normal: "text-[1rem]",
  grande: "text-[1.125rem]",
  extra: "text-[1.25rem]",
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5">
      <span>
        <span className="block text-[1.0625rem] font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-[0.9375rem] text-muted">{description}</span>
      </span>
      <span className="relative mt-1 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-8 w-14 rounded-full bg-field-border transition peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-yellow dark:peer-checked:bg-brand-yellow" />
        <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-surface shadow transition peer-checked:translate-x-6 peer-checked:bg-brand-yellow dark:peer-checked:bg-ink" />
      </span>
    </label>
  );
}

export function AccessibilitySettings({ initial, showMode = false }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState<A11yPrefs>(initial);
  const [saving, setSaving] = useState(false);

  async function update(patch: Partial<A11yPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    applyA11yPrefs(next); // se ve el cambio al instante
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_ui_preferences", {
      p_ui_mode: next.uiMode,
      p_text_size: next.textSize,
      p_high_contrast: next.highContrast,
      p_reduce_motion: next.reduceMotion,
    });
    setSaving(false);
    if (error) {
      showToast("No se pudo guardar. Se aplica solo en este dispositivo.", "error");
      return;
    }
    if (patch.uiMode) router.refresh();
  }

  const modes: { value: UiMode; title: string; body: string }[] = [
    { value: "normal", title: "Completa", body: "Todo a la mano: pedidos, etapas, cupones, puntos y referidos." },
    {
      value: "sencillo",
      title: "Sencilla",
      body: "Letra grande, botones grandes y solo lo importante: pedir, ver tu coche y escribirnos.",
    },
  ];

  return (
    <div className="space-y-7" aria-busy={saving}>
      {showMode ? (
        <fieldset>
          <legend className="text-[1.0625rem] font-semibold text-foreground">¿Cómo quieres ver tu portal?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {modes.map((m) => {
              const active = prefs.uiMode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    update(
                      m.value === "sencillo" && prefs.textSize === "normal"
                        ? { uiMode: m.value, textSize: "grande" }
                        : { uiMode: m.value },
                    )
                  }
                  className={`relative rounded-2xl border-2 p-4 text-left transition ${
                    active
                      ? "border-ink bg-highlight dark:border-brand-yellow"
                      : "border-field-border hover:border-foreground/40"
                  }`}
                >
                  {active ? (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-brand-yellow">
                      <Check size={16} strokeWidth={3} />
                    </span>
                  ) : null}
                  <span className="block font-display text-[1.75rem] font-extrabold uppercase leading-none text-foreground">
                    {m.title}
                  </span>
                  <span className="mt-2 block text-[0.9375rem] text-muted">{m.body}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="text-[1.0625rem] font-semibold text-foreground">Tamaño de letra</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {sizes.map((s) => {
            const active = prefs.textSize === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => update({ textSize: s })}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 transition ${
                  active
                    ? "border-ink bg-ink text-brand-yellow dark:border-brand-yellow"
                    : "border-field-border text-foreground hover:border-foreground/40"
                }`}
              >
                <span className={`font-display font-extrabold leading-none ${sizePreview[s]}`}>Aa</span>
                <span className="text-[0.8125rem] font-semibold">{textSizeLabels[s]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-5 border-t-2 border-dashed border-seam pt-6">
        <Toggle
          checked={prefs.highContrast}
          onChange={(v) => update({ highContrast: v })}
          label="Alto contraste"
          description="Textos secundarios y bordes más oscuros para leer mejor."
        />
        <Toggle
          checked={prefs.reduceMotion}
          onChange={(v) => update({ reduceMotion: v })}
          label="Menos animaciones"
          description="Quita movimientos y transiciones de la pantalla."
        />
      </div>

      <p className="text-[0.8125rem] text-muted">
        Se guarda en tu cuenta: lo verás igual en tu celular y en la computadora.
      </p>
    </div>
  );
}

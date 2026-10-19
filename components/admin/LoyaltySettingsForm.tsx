"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Settings {
  pesos_per_point: number;
  points_for_reward: number;
  reward_type: "percentage" | "fixed";
  reward_value: number;
}

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";
const labelClassName = "mb-1.5 block text-[15px] font-medium text-foreground";

export function LoyaltySettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [pesosPerPoint, setPesosPerPoint] = useState(String(settings.pesos_per_point));
  const [pointsForReward, setPointsForReward] = useState(String(settings.points_for_reward));
  const [rewardType, setRewardType] = useState(settings.reward_type);
  const [rewardValue, setRewardValue] = useState(String(settings.reward_value));
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    const supabase = createClient();
    await supabase
      .from("loyalty_settings")
      .update({
        pesos_per_point: Number(pesosPerPoint),
        points_for_reward: Number(pointsForReward),
        reward_type: rewardType,
        reward_value: Number(rewardValue),
      })
      .eq("id", 1);

    setSuccess(true);
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      {success ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-[15px] text-green-700 dark:text-green-400">
          Configuración guardada.
        </div>
      ) : null}

      <div>
        <label className={labelClassName}>Pesos gastados por cada punto</label>
        <input
          type="number"
          value={pesosPerPoint}
          onChange={(e) => setPesosPerPoint(e.target.value)}
          className={fieldClassName}
          disabled={isSaving}
        />
        <p className="mt-1 text-[13px] text-muted">
          Ej. 100 = el cliente gana 1 punto por cada $100 gastados.
        </p>
      </div>

      <div>
        <label className={labelClassName}>Puntos necesarios para canjear</label>
        <input
          type="number"
          value={pointsForReward}
          onChange={(e) => setPointsForReward(e.target.value)}
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Tipo de recompensa</label>
          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value as "percentage" | "fixed")}
            className={fieldClassName}
            disabled={isSaving}
          >
            <option value="fixed">Monto fijo ($)</option>
            <option value="percentage">Porcentaje (%)</option>
          </select>
        </div>
        <div>
          <label className={labelClassName}>Valor</label>
          <input
            type="number"
            value={rewardValue}
            onChange={(e) => setRewardValue(e.target.value)}
            className={fieldClassName}
            disabled={isSaving}
          />
        </div>
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
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
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";
const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

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
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      {success ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
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
        <p className="mt-1 text-xs text-muted">
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
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
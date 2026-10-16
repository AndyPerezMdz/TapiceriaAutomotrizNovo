"use client";

import { useToast } from "@/components/shared/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface StageItem {
  id: string;
  serviceId: string | null;
  serviceTitle: string | null;
  currentStageId: string | null;
}

interface Stage {
  id: string;
  service_id: string;
  name: string;
  order: number;
  is_active: boolean;
}

interface HistoryRow {
  id: string;
  order_item_id: string;
  stage_name: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export function OrderStagesPanel({ items }: { items: StageItem[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [stages, setStages] = useState<Stage[]>([]);
  const [current, setCurrent] = useState<Record<string, string | null>>(
    Object.fromEntries(items.map((i) => [i.id, i.currentStageId])),
  );
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [notify, setNotify] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const itemKey = items.map((i) => i.id).join(",");
  const serviceKey = [
    ...new Set(items.map((i) => i.serviceId).filter((s): s is string => Boolean(s))),
  ].join(",");

  useEffect(() => {
    const serviceIds = serviceKey.split(",").filter(Boolean);
    if (serviceIds.length === 0) return;
    const supabase = createClient();
    supabase
      .from("service_stages")
      .select("id, service_id, name, order, is_active")
      .in("service_id", serviceIds)
      .order("order", { ascending: true })
      .then(({ data }) => setStages(data ?? []));
  }, [serviceKey]);

  const loadHistory = useCallback(async () => {
    const ids = itemKey.split(",").filter(Boolean);
    if (ids.length === 0) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("order_item_stage_history")
      .select(
        "id, order_item_id, stage_name, created_at, profiles!order_item_stage_history_changed_by_fkey(full_name)",
      )
      .in("order_item_id", ids)
      .order("created_at", { ascending: false })
      .limit(6);
    setHistory((data as unknown as HistoryRow[]) ?? []);
  }, [itemKey]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function stagesFor(item: StageItem): Stage[] {
    const currentId = current[item.id];
    return stages
      .filter((s) => s.service_id === item.serviceId && (s.is_active || s.id === currentId))
      .sort((a, b) => a.order - b.order);
  }

  async function changeStage(item: StageItem, stageId: string) {
    setBusyItem(item.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_order_item_stage", {
      p_item_id: item.id,
      p_stage_id: stageId,
    });

    if (error) {
      showToast("No se pudo cambiar la etapa.", "error");
      setBusyItem(null);
      return;
    }

    setCurrent((prev) => ({ ...prev, [item.id]: stageId }));

    if (notify) {
      fetch("/api/notify/stage-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      }).catch(() => {});
    }

    await loadHistory();
    setBusyItem(null);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <h2 className="mb-1 text-sm font-semibold text-foreground">Etapas del proceso</h2>
      <p className="mb-4 text-xs text-muted">
        Lo que cambies aquí lo ve el cliente en su pedido al momento.
      </p>

      <div className="space-y-4">
        {items.map((item) => {
          const list = stagesFor(item);
          const currentId = current[item.id];
          const currentIndex = list.findIndex((s) => s.id === currentId);
          const currentStage = currentIndex === -1 ? null : list[currentIndex];
          const next = currentIndex === -1 ? list[0] : list[currentIndex + 1];

          return (
            <div
              key={item.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {item.serviceTitle ?? "Servicio"}
                </p>
                {currentStage ? (
                  <span className="rounded-full bg-brand-yellow/20 px-2.5 py-0.5 text-xs font-medium text-brand-yellow-dark dark:text-brand-yellow">
                    Etapa {currentIndex + 1} de {list.length}
                  </span>
                ) : null}
              </div>

              {list.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Este servicio todavía no tiene etapas. El admin puede agregarlas desde
                  Servicios.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-lg font-bold text-foreground">
                    {currentStage ? currentStage.name : "Sin etapa asignada"}
                  </p>

                  <div className="flex gap-1">
                    {list.map((s, i) => (
                      <div
                        key={s.id}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= currentIndex ? "bg-brand-yellow" : "bg-black/10 dark:bg-white/10"
                        }`}
                      />
                    ))}
                  </div>

                  {next ? (
                    <button
                      onClick={() => changeStage(item, next.id)}
                      disabled={busyItem === item.id}
                      className="flex w-full items-center justify-between rounded-md bg-brand-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
                    >
                      <span>
                        {currentStage ? "Avanzar a" : "Comenzar con"}: {next.name}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <p className="text-xs text-muted">Este servicio ya llegó a su última etapa.</p>
                  )}

                  <div>
                    <label
                      htmlFor={`stage-${item.id}`}
                      className="mb-1 block text-xs text-muted"
                    >
                      O elige otra etapa
                    </label>
                    <select
                      id={`stage-${item.id}`}
                      value={currentId ?? ""}
                      disabled={busyItem === item.id}
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== currentId) {
                          changeStage(item, e.target.value);
                        }
                      }}
                      className="w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:opacity-60 dark:border-white/15"
                    >
                      {!currentId ? (
                        <option value="" disabled>
                          Elegir etapa...
                        </option>
                      ) : null}
                      {list.map((s, i) => (
                        <option key={s.id} value={s.id}>
                          {i + 1} · {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm text-foreground">Avisar al cliente al cambiar de etapa</span>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          aria-label="Avisar al cliente al cambiar de etapa"
          onClick={() => setNotify((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            notify ? "bg-brand-yellow" : "bg-black/15 dark:bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              notify ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {history.length > 0 ? (
        <div className="mt-4 border-t border-black/10 pt-3 dark:border-white/10">
          <p className="mb-2 text-xs font-semibold text-muted">Cambios recientes</p>
          <div className="space-y-1.5">
            {history.map((h) => {
              const serviceTitle = items.find((i) => i.id === h.order_item_id)?.serviceTitle;
              return (
                <div key={h.id} className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-foreground">
                    {h.stage_name}
                    {items.length > 1 && serviceTitle ? (
                      <span className="text-muted"> · {serviceTitle}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-muted">
                    {new Date(h.created_at).toLocaleString("es-MX", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "America/Merida",
                    })}
                    {h.profiles?.full_name ? ` · ${h.profiles.full_name}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
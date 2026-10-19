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
    <div className="rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      <h2 className="font-display text-[28px] font-bold uppercase leading-none text-foreground">Etapas</h2>
      <p className="mb-5 mt-2 text-[15px] text-muted">
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
              className="rounded-2xl border-[1.5px] border-seam p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[17px] font-semibold text-foreground">
                  {item.serviceTitle ?? "Servicio"}
                </p>
                {currentStage ? (
                  <span className="text-sm text-muted">
                    Etapa {currentIndex + 1} de {list.length}
                  </span>
                ) : null}
              </div>

              {list.length === 0 ? (
                <p className="mt-2 text-[15px] text-muted">
                  Este servicio todavía no tiene etapas. El admin puede agregarlas desde
                  Servicios.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div
                    role="group"
                    aria-label={`Etapa de ${item.serviceTitle ?? "servicio"}`}
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${Math.min(list.length, 4)}, minmax(0, 1fr))` }}
                  >
                    {list.map((s, i) => {
                      const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "pending";
                      return (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={state === "current"}
                          disabled={busyItem === item.id || state === "current"}
                          onClick={() => changeStage(item, s.id)}
                          className={`min-h-12 rounded-[10px] px-2 text-sm leading-tight transition disabled:cursor-default ${
                            state === "done"
                              ? "bg-ink font-semibold text-on-ink dark:ring-1 dark:ring-white/10"
                              : state === "current"
                                ? "bg-brand-yellow font-bold text-ink shadow-[0_0_0_3px_rgba(245,197,24,0.35)]"
                                : "border-[1.5px] border-dashed border-field-border bg-surface text-foreground/80 hover:border-foreground"
                          }`}
                        >
                          {state === "done" ? "✓ " : ""}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>

                  {next ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted">
                        {currentStage ? `Ahora: ${currentStage.name}` : "Aún no inicia"}
                      </p>
                      <button
                        type="button"
                        onClick={() => changeStage(item, next.id)}
                        disabled={busyItem === item.id}
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-semibold text-brand-yellow transition hover:bg-ink-soft disabled:opacity-60 dark:ring-1 dark:ring-white/10"
                      >
                        {currentStage ? "Pasar a" : "Iniciar:"} {next.name}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[15px] font-semibold text-foreground">
                      ✓ Este servicio ya llegó a su última etapa.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex min-h-11 items-center justify-between gap-3">
        <span className="text-[15px] text-foreground">Avisar al cliente por notificación</span>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          aria-label="Avisar al cliente al cambiar de etapa"
          onClick={() => setNotify((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            notify ? "bg-ink dark:bg-brand-yellow" : "bg-seam"
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
        <div className="mt-5 border-t-2 border-dashed border-seam pt-4">
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Cambios recientes</p>
          <div className="space-y-1.5">
            {history.map((h) => {
              const serviceTitle = items.find((i) => i.id === h.order_item_id)?.serviceTitle;
              return (
                <div key={h.id} className="flex items-start justify-between gap-3 text-sm">
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
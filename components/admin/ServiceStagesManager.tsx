"use client";

import { useToast } from "@/components/shared/ToastProvider";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Stage {
  id: string;
  name: string;
  client_description: string | null;
  order: number;
  is_active: boolean;
}

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

export function ServiceStagesManager({ serviceId }: { serviceId: string }) {
  const { confirm, dialog } = useConfirm();
  const { showToast } = useToast();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("service_stages")
      .select("id, name, client_description, order, is_active")
      .eq("service_id", serviceId)
      .order("order", { ascending: true });
    setStages(data ?? []);
    setLoading(false);
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addStage() {
    if (!newName.trim()) return;
    const supabase = createClient();
    const nextOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order)) + 1 : 1;
    const { error } = await supabase.from("service_stages").insert({
      service_id: serviceId,
      name: newName.trim(),
      client_description: newDescription.trim() || null,
      order: nextOrder,
    });
    if (error) {
      showToast("No se pudo agregar la etapa.", "error");
      return;
    }
    setNewName("");
    setNewDescription("");
    load();
  }

  function startEdit(stage: Stage) {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditDescription(stage.client_description ?? "");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("service_stages")
      .update({ name: editName.trim(), client_description: editDescription.trim() || null })
      .eq("id", id);
    if (error) {
      showToast("No se pudo guardar el cambio.", "error");
      return;
    }
    setEditingId(null);
    load();
  }

  async function toggleActive(stage: Stage) {
    const supabase = createClient();
    const { error } = await supabase
      .from("service_stages")
      .update({ is_active: !stage.is_active })
      .eq("id", stage.id);
    if (error) {
      showToast("No se pudo actualizar la etapa.", "error");
      return;
    }
    load();
  }

  async function move(stage: Stage, direction: "up" | "down") {
    const index = stages.findIndex((s) => s.id === stage.id);
    const target = stages[direction === "up" ? index - 1 : index + 1];
    if (!target) return;
    const supabase = createClient();
    const results = await Promise.all([
      supabase.from("service_stages").update({ order: target.order }).eq("id", stage.id),
      supabase.from("service_stages").update({ order: stage.order }).eq("id", target.id),
    ]);
    if (results.some((r) => r.error)) {
      showToast("No se pudo reordenar.", "error");
    }
    load();
  }

  async function deleteStage(stage: Stage) {
    const supabase = createClient();
    const { count } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("current_stage_id", stage.id);

    if ((count ?? 0) > 0) {
      showToast(
        `Esta etapa está en uso en ${count} pedido(s). Mejor desactívala para ocultarla.`,
        "error",
      );
      return;
    }

    const ok = await confirm({
      title: "Eliminar etapa",
      description: `Se eliminará "${stage.name}" de este servicio. El historial de pedidos anteriores se conserva.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    const { error } = await supabase.from("service_stages").delete().eq("id", stage.id);
    if (error) {
      showToast("No se pudo eliminar.", "error");
      return;
    }
    load();
  }

  if (loading) return <p className="text-sm text-muted">Cargando etapas...</p>;

  return (
    <div className="space-y-3">
      {dialog}

      {stages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-4 text-sm text-muted dark:border-white/15">
          Este servicio todavía no tiene etapas. Agrega la primera abajo.
        </p>
      ) : null}

      {stages.map((stage, index) => (
        <div
          key={stage.id}
          className={`rounded-lg border border-black/10 bg-surface p-3 dark:border-white/10 ${
            stage.is_active ? "" : "opacity-60"
          }`}
        >
          {editingId === stage.id ? (
            <div className="space-y-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nombre de la etapa"
                className={fieldClassName}
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                placeholder="Qué se hace en esta etapa (lo ve el cliente)"
                className={fieldClassName}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(stage.id)}
                  className="rounded-md bg-brand-black px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-brand-black"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground dark:border-white/15"
                >
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-xs font-semibold text-brand-yellow-dark dark:text-brand-yellow">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{stage.name}</p>
                  {stage.client_description ? (
                    <p className="mt-0.5 text-xs text-muted">{stage.client_description}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => move(stage, "up")}
                  disabled={index === 0}
                  aria-label="Subir etapa"
                  className="rounded p-1.5 text-muted transition hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => move(stage, "down")}
                  disabled={index === stages.length - 1}
                  aria-label="Bajar etapa"
                  className="rounded p-1.5 text-muted transition hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => startEdit(stage)}
                  aria-label="Editar etapa"
                  className="rounded p-1.5 text-muted transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => toggleActive(stage)}
                  className="rounded px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {stage.is_active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => deleteStage(stage)}
                  aria-label="Eliminar etapa"
                  className="rounded p-1.5 text-muted transition hover:bg-brand-red/10 hover:text-brand-red"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="rounded-lg border border-dashed border-black/20 p-3 dark:border-white/20">
        <p className="mb-2 text-sm font-medium text-foreground">Agregar etapa</p>
        <div className="space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre (ej. Reparando espuma)"
            className={fieldClassName}
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            placeholder="Qué se hace en esta etapa (lo ve el cliente)"
            className={fieldClassName}
          />
          <button
            onClick={addStage}
            className="flex items-center gap-1 rounded-md bg-brand-black px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-brand-black"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
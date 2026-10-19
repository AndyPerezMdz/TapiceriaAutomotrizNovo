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
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";

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

  if (loading) return <p className="text-[15px] text-muted">Cargando etapas...</p>;

  return (
    <div className="space-y-3">
      {dialog}

      {stages.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-field-border p-4 text-[15px] text-muted">
          Este servicio todavía no tiene etapas. Agrega la primera abajo.
        </p>
      ) : null}

      {stages.map((stage, index) => (
        <div
          key={stage.id}
          className={`rounded-2xl bg-surface p-3 dark:ring-1 dark:ring-white/5 ${
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
                  className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-3 py-1.5 text-[13px] font-semibold text-ink min-h-11 inline-flex items-center justify-center"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1 rounded-xl border-[1.5px] border-field-border px-3 py-1.5 text-[13px] font-medium text-foreground min-h-11"
                >
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-highlight text-[13px] font-semibold text-yellow-text">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-foreground">{stage.name}</p>
                  {stage.client_description ? (
                    <p className="mt-0.5 text-[13px] text-muted">{stage.client_description}</p>
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

      <div className="rounded-2xl border-2 border-dashed border-field-border p-3">
        <p className="mb-2 text-[15px] font-medium text-foreground">Agregar etapa</p>
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
            className="flex items-center gap-1 rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-3 py-1.5 text-[13px] font-semibold text-ink min-h-11"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
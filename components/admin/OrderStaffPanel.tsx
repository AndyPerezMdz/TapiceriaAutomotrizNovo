"use client";

import { statusLabels, orderStatusValues } from "@/lib/validations/admin-order";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function getAllowedStatuses(current: string): string[] {
  const transitions: Record<string, string[]> = {
    pendiente_revision: ["pendiente_revision", "cotizado", "cancelado"],
    cotizado: ["cotizado", "cancelado"],
    aprobado: ["aprobado", "en_proceso", "cotizado", "cancelado"],
    rechazado: ["rechazado", "cancelado"],
    en_proceso: ["en_proceso", "listo_para_entrega", "cancelado"],
    listo_para_entrega: ["listo_para_entrega", "entregado", "cancelado"],
    entregado: ["entregado"],
    cancelado: ["cancelado"],
  };
  return transitions[current] ?? [current];
}

interface Props {
  orderId: string;
  currentStatus: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  adminNotes: string | null;
  isAdmin: boolean;
  clientPhone: string | null;
  clientName: string | null;
  vehicleLabel: string;
}

export function OrderStaffPanel({
  orderId,
  currentStatus,
  estimatedPrice,
  finalPrice,
  adminNotes,
  isAdmin,
  clientPhone,
  clientName,
  vehicleLabel,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [price, setPrice] = useState(
    finalPrice?.toString() ?? estimatedPrice?.toString() ?? "",
  );
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isLocked = currentStatus === "cancelado" || currentStatus === "entregado";

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    const supabase = createClient();

    const updatePayload: Record<string, unknown> = { status };

    if (isAdmin) {
      const numericPrice = price ? Number(price) : null;
      updatePayload.estimated_price = numericPrice;
      if (status === "entregado") {
        updatePayload.final_price = numericPrice;
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      setSaveError("No se pudo guardar. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    if (note.trim()) {
      const { data: lastHistoryEntry } = await supabase
        .from("order_status_history")
        .select("id")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastHistoryEntry) {
        const { error: noteError } = await supabase
          .from("order_status_history")
          .update({ note: note.trim() })
          .eq("id", lastHistoryEntry.id);

        if (noteError) {
          console.error("Error guardando nota:", noteError.message);
        }
      }
    }

    router.refresh();
    setIsSaving(false);
    setNote("");
  }

  const whatsappHref = clientPhone
    ? buildWhatsAppLink(
        `Hola ${clientName ?? ""}, tu pedido de ${vehicleLabel} cambió de estado a: ${statusLabels[status]}.`,
      ).replace(/wa\.me\/52\d{10}/, `wa.me/52${clientPhone}`)
    : null;

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Gestión del pedido
      </h2>

      {isLocked ? (
        <div className="mb-4 rounded-md border border-black/10 bg-black/5 px-3.5 py-2.5 text-sm text-muted dark:border-white/10 dark:bg-white/5">
          Este pedido ya está en un estado final y no se puede editar.
        </div>
      ) : null}

      {saveError ? (
        <div className="mb-4 rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {saveError}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isLocked}
            className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15"
          >
            {getAllowedStatuses(currentStatus).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>

        {isAdmin ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Precio {status === "entregado" ? "final" : "estimado"} (MXN)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              disabled={isLocked}
              className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15"
            />
          </div>
        ) : (
          <p className="text-xs text-muted">
            Solo un administrador puede fijar el precio.
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Nota para este cambio (opcional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ej. Se retrasó por falta de material..."
            disabled={isLocked}
            className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || isLocked}
          className="w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-brand-black"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-md border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2.5 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/20"
          >
            <MessageCircle size={16} /> Avisar por WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
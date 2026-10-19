"use client";

import { WhatsAppLink } from "@/components/shared/WhatsAppLink";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const statusOptions = [
  { value: "abierta", label: "Abierta" },
  { value: "atendida", label: "Atendida" },
  { value: "cerrada", label: "Cerrada" },
];

interface Props {
  complaintId: string;
  description: string;
  status: string;
  resolutionNote: string | null;
  clientPhone: string | null;
  clientName: string | null;
  satisfactionRating: number | null;
  satisfactionComment: string | null;
}

export function ComplaintDetailPanel({
  complaintId,
  description,
  status: initialStatus,
  resolutionNote: initialNote,
  clientPhone,
  clientName,
  satisfactionRating,
  satisfactionComment,
}: Props) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("complaints")
      .update({ status, resolution_note: note.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", complaintId);

    if (!error) {
      fetch("/api/notify/complaint-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId }),
      }).catch(() => {});

      setSuccess(true);
      router.refresh();
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar queja",
      description: "Esto elimina el registro por completo. Útil si se capturó por error.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    const supabase = createClient();
    await supabase.from("complaints").delete().eq("id", complaintId);
    router.push("/admin/quejas");
    router.refresh();
  }

  const whatsappHref = clientPhone
    ? buildWhatsAppLink(`Hola ${clientName ?? ""}, te contactamos sobre tu queja registrada.`, clientPhone)
    : null;

  return (
    <div className="space-y-4">
      {dialog}

      <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
        <h2 className="font-display text-2xl font-bold uppercase mb-2 text-foreground">Descripción de la queja</h2>
        <p className="break-words text-[15px] text-foreground">{description}</p>
      </div>

      {satisfactionRating ? (
        <div className="rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 bg-highlight p-5">
          <p className="mb-1 text-[15px] font-medium text-foreground">Calificación del cliente</p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= satisfactionRating ? "text-brand-yellow" : "text-black/15 dark:text-white/15"}
              >
                ★
              </span>
            ))}
          </div>
          {satisfactionComment ? (
            <p className="mt-2 text-[15px] text-muted">&quot;{satisfactionComment}&quot;</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
        <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">Gestionar queja</h2>

        {success ? (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-[15px] text-green-700 dark:text-green-400">
            Guardado. El cliente fue notificado.
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[15px] font-medium text-foreground">Estado</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setSuccess(false);
              }}
              className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[15px] font-medium text-foreground">
              Respuesta / nota de resolución
            </label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSuccess(false);
              }}
              rows={3}
              placeholder="Explica qué se hizo para resolver el problema..."
              className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
            />
            <p className="mt-1 text-[13px] text-muted">Esta nota la verá el cliente.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-4 py-2.5 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>

          {whatsappHref ? <WhatsAppLink href={whatsappHref} label="Contactar por WhatsApp" /> : null}

          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-[13px] text-muted transition hover:text-brand-red"
          >
            <Trash2 size={13} /> Eliminar queja
          </button>
        </div>
      </div>
    </div>
  );
}
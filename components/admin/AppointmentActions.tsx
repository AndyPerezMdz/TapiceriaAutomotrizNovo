"use client";

import { AppointmentEditForm } from "@/components/admin/AppointmentEditForm";
import { AppointmentStatusButton } from "@/components/admin/AppointmentStatusButton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AppointmentActions({
  id,
  status,
  appointmentDate,
  appointmentTime,
}: {
  id: string;
  status: string;
  appointmentDate: string;
  appointmentTime: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleCancel() {
    const ok = await confirm({
      title: "Cancelar cita",
      description: "El cliente dejará de ver esta cita como activa. No se elimina el registro.",
      confirmLabel: "Sí, cancelar",
    });
    if (!ok) return;

    setIsBusy(true);
    const supabase = createClient();
    await supabase.from("appointments").update({ status: "cancelada" }).eq("id", id);
    setIsBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar cita",
      description: "Esto elimina el registro por completo. Esta acción no se puede deshacer.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    setIsBusy(true);
    const supabase = createClient();
    await supabase.from("appointments").delete().eq("id", id);
    setIsBusy(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {dialog}
      {isEditing ? (
        <AppointmentEditForm
          id={id}
          currentDate={appointmentDate}
          currentTime={appointmentTime}
          onClose={() => setIsEditing(false)}
        />
      ) : null}

      <AppointmentStatusButton id={id} status={status} />

      <button
        onClick={() => setIsEditing(true)}
        disabled={isBusy}
        className="rounded-md p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground disabled:opacity-50 dark:hover:bg-white/5"
        title="Editar fecha/hora"
      >
        <Pencil size={14} />
      </button>

      <button
        onClick={handleCancel}
        disabled={isBusy}
        className="rounded-md p-1.5 text-muted transition hover:bg-brand-yellow/10 hover:text-brand-yellow-dark disabled:opacity-50 dark:hover:text-brand-yellow"
        title="Cancelar cita"
      >
        <XCircle size={14} />
      </button>

      <button
        onClick={handleDelete}
        disabled={isBusy}
        className="rounded-md p-1.5 text-muted transition hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-50"
        title="Eliminar cita"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
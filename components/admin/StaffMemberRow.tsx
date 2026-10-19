"use client";

import { useConfirm } from "@/lib/hooks/useConfirm";
import { RefreshCw, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export function StaffMemberRow({ member }: { member: StaffMember }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function callAction(action: string, extra?: Record<string, unknown>) {
    setIsLoading(action);
    setFeedback(null);

    const res = await fetch("/api/admin/manage-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: member.id, ...extra }),
    });

    const data = await res.json();

    if (!res.ok) {
      setFeedback(data.error ?? "Ocurrió un error.");
      setIsLoading(null);
      return;
    }

    if (action === "resend_invite") {
      setFeedback("Invitación reenviada.");
    }

    setIsLoading(null);
    router.refresh();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar usuario",
      description: `Se eliminará la cuenta de ${member.full_name} por completo. Su historial de acciones pasadas se conserva, pero ya no podrá iniciar sesión. Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    callAction("delete");
  }

  const hasActivated = Boolean(member.last_sign_in_at);

  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5">
      {dialog}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{member.full_name}</p>
          <p className="text-[13px] text-muted">{member.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-highlight px-2.5 py-0.5 text-[13px] font-medium capitalize text-yellow-text">
              {member.role}
            </span>
            <span
              className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${
                member.is_active
                  ? "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40"
                  : "border-[1.5px] border-muted text-muted"
              }`}
            >
              {member.is_active ? "Activo" : "Desactivado"}
            </span>
            {!hasActivated ? (
              <span className="rounded-full border-[1.5px] border-dashed border-foreground text-foreground px-2.5 py-0.5 text-[13px] font-medium">
                Invitación pendiente
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {feedback ? <p className="mt-2 text-[13px] text-brand-red">{feedback}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() =>
            callAction("change_role", {
              role: member.role === "admin" ? "empleado" : "admin",
            })
          }
          disabled={isLoading !== null}
          className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-field-border px-3 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5 min-h-11"
        >
          <ShieldCheck size={13} />
          Hacer {member.role === "admin" ? "empleado" : "admin"}
        </button>

        {!hasActivated ? (
          <button
            onClick={() => callAction("resend_invite")}
            disabled={isLoading !== null}
            className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-field-border px-3 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5 min-h-11"
          >
            <RefreshCw size={13} />
            {isLoading === "resend_invite" ? "Enviando..." : "Reenviar invitación"}
          </button>
        ) : null}

        <button
          onClick={() => callAction("toggle_active")}
          disabled={isLoading !== null}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition disabled:opacity-50 ${
            member.is_active
              ? "border-brand-red/30 text-brand-red hover:bg-brand-red/5"
              : "border-green-500/30 text-green-700 hover:bg-green-500/5 dark:text-green-400"
          }`}
        >
          {member.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
          {member.is_active ? "Desactivar" : "Reactivar"}
        </button>

        <button
          onClick={handleDelete}
          disabled={isLoading !== null}
          className="flex items-center gap-1.5 rounded-xl border border-brand-red/30 px-3 py-1.5 text-[13px] font-medium text-brand-red transition hover:bg-brand-red/5 disabled:opacity-50"
        >
          <Trash2 size={13} />
          {isLoading === "delete" ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </div>
  );
}
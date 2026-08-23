"use client";

import { RefreshCw, ShieldCheck, UserX, UserCheck } from "lucide-react";
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

  const hasActivated = Boolean(member.last_sign_in_at);

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{member.full_name}</p>
          <p className="text-xs text-muted">{member.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-yellow/20 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-yellow-dark dark:text-brand-yellow">
              {member.role}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                member.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {member.is_active ? "Activo" : "Desactivado"}
            </span>
            {!hasActivated ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Invitación pendiente
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {feedback ? <p className="mt-2 text-xs text-brand-red">{feedback}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() =>
            callAction("change_role", {
              role: member.role === "admin" ? "empleado" : "admin",
            })
          }
          disabled={isLoading !== null}
          className="flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
        >
          <ShieldCheck size={13} />
          Hacer {member.role === "admin" ? "empleado" : "admin"}
        </button>

        {!hasActivated ? (
          <button
            onClick={() => callAction("resend_invite")}
            disabled={isLoading !== null}
            className="flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
          >
            <RefreshCw size={13} />
            {isLoading === "resend_invite" ? "Enviando..." : "Reenviar invitación"}
          </button>
        ) : null}

        <button
          onClick={() => callAction("toggle_active")}
          disabled={isLoading !== null}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
            member.is_active
              ? "border-brand-red/30 text-brand-red hover:bg-brand-red/5"
              : "border-green-500/30 text-green-700 hover:bg-green-500/5 dark:text-green-400"
          }`}
        >
          {member.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
          {member.is_active ? "Desactivar" : "Reactivar"}
        </button>
      </div>
    </div>
  );
}
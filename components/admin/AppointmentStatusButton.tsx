"use client";
import { appointmentStatusTone, statusTone } from "@/lib/constants/status-colors";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
const cycle: Record<string, string> = {
  pendiente: "confirmada",
  confirmada: "completada",
  completada: "pendiente",
};
const labels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
};
export function AppointmentStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);
  async function handleClick() {
    const next = cycle[current] ?? "pendiente";
    setIsUpdating(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status: next })
      .eq("id", id);
    if (!error) {
      setCurrent(next);
      fetch("/api/notify/appointment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id }),
      }).catch(() => {});
      router.refresh();
    }
    setIsUpdating(false);
  }
  const tone = appointmentStatusTone[current] ?? "neutral";
  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${statusTone[tone]}`}
    >
      {labels[current] ?? current}
    </button>
  );
}
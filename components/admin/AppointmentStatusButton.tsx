"use client";

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

const colors: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  confirmada: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  completada: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
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
      router.refresh();
    }
    setIsUpdating(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${
        colors[current] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[current] ?? current}
    </button>
  );
}
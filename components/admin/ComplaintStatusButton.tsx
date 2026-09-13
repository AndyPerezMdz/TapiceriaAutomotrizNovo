"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const cycle: Record<string, string> = {
  abierta: "atendida",
  atendida: "cerrada",
  cerrada: "abierta",
};

const labels: Record<string, string> = {
  abierta: "Abierta",
  atendida: "Atendida",
  cerrada: "Cerrada",
};

const colors: Record<string, string> = {
  abierta: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  atendida: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  cerrada: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export function ComplaintStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleClick() {
    const next = cycle[current] ?? "abierta";
    setIsUpdating(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("complaints")
      .update({ status: next, updated_at: new Date().toISOString() })
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
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${colors[current]}`}
    >
      {labels[current]}
    </button>
  );
}
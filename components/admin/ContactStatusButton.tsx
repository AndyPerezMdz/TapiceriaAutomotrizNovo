"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const statusCycle: Record<string, string> = {
  nuevo: "contactado",
  contactado: "cerrado",
  cerrado: "nuevo",
};

const statusLabels: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cerrado: "Cerrado",
};

const statusColors: Record<string, string> = {
  nuevo: "bg-brand-yellow/20 text-brand-yellow-dark dark:text-brand-yellow",
  contactado: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  cerrado: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function ContactStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleClick() {
    const next = statusCycle[current] ?? "nuevo";
    setIsUpdating(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("contact_submissions")
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
      className={`rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${
        statusColors[current] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {statusLabels[current] ?? current}
    </button>
  );
}
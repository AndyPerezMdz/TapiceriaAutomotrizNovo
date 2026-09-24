"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const cycle: Record<string, string> = {
  nuevo: "revisado",
  revisado: "nuevo",
};

const labels: Record<string, string> = {
  nuevo: "Nuevo",
  revisado: "Revisado",
};

const colors: Record<string, string> = {
  nuevo: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  revisado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export function SiteFeedbackStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleClick() {
    const next = cycle[current] ?? "nuevo";
    setIsUpdating(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_feedback").update({ status: next }).eq("id", id);

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
      {labels[current] ?? current}
    </button>
  );
}

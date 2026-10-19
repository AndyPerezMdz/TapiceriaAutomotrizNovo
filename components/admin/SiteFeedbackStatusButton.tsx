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
  nuevo: "border-[1.5px] border-dashed border-foreground text-foreground",
  revisado: "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
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
      className={`shrink-0 rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] transition hover:opacity-80 disabled:opacity-50 ${colors[current]}`}
    >
      {labels[current] ?? current}
    </button>
  );
}

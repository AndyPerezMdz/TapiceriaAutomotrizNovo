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
  nuevo: "bg-highlight text-yellow-text",
  contactado: "bg-brand-yellow text-ink",
  cerrado: "border-[1.5px] border-muted text-muted",
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
      className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] transition hover:opacity-80 disabled:opacity-50 ${
        statusColors[current] ?? "border-[1.5px] border-muted text-muted"
      }`}
    >
      {statusLabels[current] ?? current}
    </button>
  );
}
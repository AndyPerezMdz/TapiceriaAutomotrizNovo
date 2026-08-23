"use client";

import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  serviceId: string;
  currentOrder: number;
  neighborId: string | null;
  neighborOrder: number | null;
  disabled: boolean;
}

export function ServiceOrderButton({
  serviceId,
  currentOrder,
  neighborId,
  neighborOrder,
  disabled,
}: Props) {
  const router = useRouter();
  const [isMoving, setIsMoving] = useState(false);

  async function handleMove() {
    if (!neighborId || neighborOrder === null || isMoving) return;
    setIsMoving(true);

    const supabase = createClient();
    await Promise.all([
      supabase.from("services").update({ order: neighborOrder }).eq("id", serviceId),
      supabase.from("services").update({ order: currentOrder }).eq("id", neighborId),
    ]);

    router.refresh();
    setIsMoving(false);
  }

  return (
    <button
      onClick={handleMove}
      disabled={disabled || isMoving}
      className="rounded-md p-1 text-muted transition hover:bg-black/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/5"
    >
      {neighborOrder !== null && neighborOrder < currentOrder ? (
        <ChevronUp size={16} />
      ) : (
        <ChevronDown size={16} />
      )}
    </button>
  );
}
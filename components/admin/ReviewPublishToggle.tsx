"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewPublishToggle({
  reviewId,
  isPublished,
}: {
  reviewId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleToggle() {
    setIsSaving(true);
    const supabase = createClient();
    await supabase.from("reviews").update({ is_published: !isPublished }).eq("id", reviewId);
    router.refresh();
    setIsSaving(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isSaving}
      className={`shrink-0 rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] transition disabled:opacity-50 ${
        isPublished
          ? "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40"
          : "border-[1.5px] border-field-border text-muted"
      }`}
    >
      {isPublished ? "Publicada" : "Publicar"}
    </button>
  );
}
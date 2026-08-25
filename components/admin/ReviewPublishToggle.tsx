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
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
        isPublished
          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
          : "border border-black/15 text-muted dark:border-white/15"
      }`}
    >
      {isPublished ? "Publicada" : "Publicar"}
    </button>
  );
}
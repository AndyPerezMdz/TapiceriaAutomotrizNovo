"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ComplaintRatingForm({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setIsSaving(true);

    const supabase = createClient();
    await supabase
      .from("complaints")
      .update({ satisfaction_rating: rating, satisfaction_comment: comment.trim() || null })
      .eq("id", complaintId);

    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <p className="mb-1 text-sm font-medium text-foreground">
        ¿Qué tan bien se resolvió tu queja?
      </p>
      <p className="mb-3 text-xs text-muted">Tu opinión nos ayuda a mejorar.</p>

      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl transition ${
              star <= rating ? "text-brand-yellow" : "text-black/15 hover:text-black/30 dark:text-white/15"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Comentario opcional..."
        className="w-full rounded-md border border-black/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
        disabled={isSaving}
      />

      <button
        onClick={handleSubmit}
        disabled={isSaving || rating === 0}
        className="mt-3 rounded-md bg-brand-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Enviando..." : "Enviar calificación"}
      </button>
    </div>
  );
}
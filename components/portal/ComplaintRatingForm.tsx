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
    <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      <p className="mb-1 text-[15px] font-medium text-foreground">
        ¿Qué tan bien se resolvió tu queja?
      </p>
      <p className="mb-3 text-[13px] text-muted">Tu opinión nos ayuda a mejorar.</p>

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
        className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
        disabled={isSaving}
      />

      <button
        onClick={handleSubmit}
        disabled={isSaving || rating === 0}
        className="mt-3 rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-5 py-2 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
      >
        {isSaving ? "Enviando..." : "Enviar calificación"}
      </button>
    </div>
  );
}
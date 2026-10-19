"use client";

import { createClient } from "@/lib/supabase/client";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Selecciona una calificación.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      order_id: orderId,
      client_id: user.id,
      rating,
      comment: comment.trim() || null,
    });

    if (insertError) {
      setError("No se pudo enviar tu reseña. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 bg-highlight p-5">
      <p className="font-medium text-foreground">¿Cómo fue tu experiencia?</p>
      <p className="mt-1 text-[15px] text-muted">
        Tu opinión nos ayuda a mejorar.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error ? <p className="text-[15px] text-brand-red">{error}</p> : null}

        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isSaving}
            >
              <Star
                size={28}
                className={
                  star <= (hoverRating || rating)
                    ? "fill-brand-yellow text-yellow-text"
                    : "text-black/20 dark:text-white/20"
                }
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Cuéntanos más (opcional)"
          disabled={isSaving}
          className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
        />

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
        >
          {isSaving ? "Enviando..." : "Enviar reseña"}
        </button>
      </form>
    </div>
  );
}
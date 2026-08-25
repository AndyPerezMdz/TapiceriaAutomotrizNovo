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
    <div className="rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-5">
      <p className="font-medium text-foreground">¿Cómo fue tu experiencia?</p>
      <p className="mt-1 text-sm text-muted">
        Tu opinión nos ayuda a mejorar.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error ? <p className="text-sm text-brand-red">{error}</p> : null}

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
                    ? "fill-brand-yellow text-brand-yellow-dark"
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
          className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
        />

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
        >
          {isSaving ? "Enviando..." : "Enviar reseña"}
        </button>
      </form>
    </div>
  );
}
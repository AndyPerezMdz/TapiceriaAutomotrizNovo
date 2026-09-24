"use client";

import { useToast } from "@/components/shared/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FeedbackType = "sugerencia" | "queja";

export function SiteFeedbackForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [type, setType] = useState<FeedbackType>("sugerencia");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;

    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("Tu sesión expiró. Inicia sesión de nuevo.", "error");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from("site_feedback").insert({
      client_id: user.id,
      type,
      message: message.trim(),
    });

    if (error) {
      showToast("No se pudo enviar tu mensaje. Intenta de nuevo.", "error");
      setIsSaving(false);
      return;
    }

    showToast(
      type === "sugerencia" ? "¡Gracias por tu sugerencia!" : "Recibimos tu queja, la revisaremos.",
    );
    setMessage("");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
    >
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-md border border-black/15 p-1 dark:border-white/15">
        <button
          type="button"
          onClick={() => setType("sugerencia")}
          className={`rounded-sm py-1.5 text-sm font-medium transition ${
            type === "sugerencia"
              ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
              : "text-muted hover:text-foreground"
          }`}
        >
          Sugerencia
        </button>
        <button
          type="button"
          onClick={() => setType("queja")}
          className={`rounded-sm py-1.5 text-sm font-medium transition ${
            type === "queja"
              ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
              : "text-muted hover:text-foreground"
          }`}
        >
          Queja
        </button>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder={
          type === "sugerencia"
            ? "¿Qué podríamos mejorar o agregar a la página?"
            : "Cuéntanos qué no funcionó bien en la página..."
        }
        className="w-full rounded-md border border-black/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
        disabled={isSaving}
      />

      <button
        type="submit"
        disabled={isSaving || !message.trim()}
        className="mt-2 rounded-md bg-brand-black px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Enviando..." : type === "sugerencia" ? "Enviar sugerencia" : "Enviar queja"}
      </button>
    </form>
  );
}

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
      className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5"
    >
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border-[1.5px] border-field-border p-1">
        <button
          type="button"
          onClick={() => setType("sugerencia")}
          className={`rounded-sm py-1.5 text-[15px] font-medium transition ${
            type === "sugerencia"
              ? "bg-brand-yellow hover:bg-[#e8b90f] text-ink"
              : "text-muted hover:text-foreground"
          }`}
        >
          Sugerencia
        </button>
        <button
          type="button"
          onClick={() => setType("queja")}
          className={`rounded-sm py-1.5 text-[15px] font-medium transition ${
            type === "queja"
              ? "bg-brand-yellow hover:bg-[#e8b90f] text-ink"
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
        className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
        disabled={isSaving}
      />

      <button
        type="submit"
        disabled={isSaving || !message.trim()}
        className="mt-2 rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-4 py-1.5 text-[13px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
      >
        {isSaving ? "Enviando..." : type === "sugerencia" ? "Enviar sugerencia" : "Enviar queja"}
      </button>
    </form>
  );
}

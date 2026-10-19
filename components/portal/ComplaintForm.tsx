"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function ComplaintForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!description.trim()) return;

    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró. Inicia sesión de nuevo.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("complaints").insert({
      order_id: orderId,
      client_id: user.id,
      source: "web",
      description: description.trim(),
    });

    if (insertError) {
      setError("No se pudo enviar tu queja. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    setSuccess(true);
    setIsSaving(false);
    router.refresh();
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-[15px] text-green-700 dark:text-green-400">
        Tu queja fue registrada. Puedes ver su estado en &quot;Mis quejas&quot;.
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-fit items-center gap-1.5 rounded-xl border-[1.5px] border-field-border px-3 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-black/5 dark:hover:bg-white/5 min-h-11"
      >
        <AlertTriangle size={13} /> ¿Tuviste un problema con este pedido?
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5"
    >
      <p className="mb-2 text-[15px] font-medium text-foreground">Cuéntanos qué pasó</p>
      {error ? <p className="mb-2 text-[13px] text-brand-red">{error}</p> : null}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Describe el problema que tuviste con este pedido..."
        className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
        disabled={isSaving}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={isSaving || !description.trim()}
          className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-4 py-1.5 text-[13px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
        >
          {isSaving ? "Enviando..." : "Enviar queja"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isSaving}
          className="rounded-xl border-[1.5px] border-field-border px-4 py-1.5 text-[13px] font-medium text-foreground min-h-11 inline-flex items-center justify-center"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
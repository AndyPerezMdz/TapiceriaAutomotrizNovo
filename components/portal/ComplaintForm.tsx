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
      <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
        Tu queja fue registrada. Puedes ver su estado en &quot;Mis quejas&quot;.
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-fit items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
      >
        <AlertTriangle size={13} /> ¿Tuviste un problema con este pedido?
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
    >
      <p className="mb-2 text-sm font-medium text-foreground">Cuéntanos qué pasó</p>
      {error ? <p className="mb-2 text-xs text-brand-red">{error}</p> : null}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Describe el problema que tuviste con este pedido..."
        className="w-full rounded-md border border-black/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
        disabled={isSaving}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={isSaving || !description.trim()}
          className="rounded-md bg-brand-black px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
        >
          {isSaving ? "Enviando..." : "Enviar queja"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isSaving}
          className="rounded-md border border-black/15 px-4 py-1.5 text-xs font-medium text-foreground dark:border-white/15"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
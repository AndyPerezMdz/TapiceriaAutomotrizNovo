"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function StaffComplaintForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

    const { data: order } = await supabase
      .from("orders")
      .select("client_id")
      .eq("id", orderId)
      .single();

    if (!order) {
      setError("No se encontró el pedido.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("complaints").insert({
      order_id: orderId,
      client_id: order.client_id,
      source: "whatsapp",
      description: description.trim(),
      created_by: user?.id,
    });

    if (insertError) {
      setError("No se pudo registrar la queja.");
      setIsSaving(false);
      return;
    }

    setDescription("");
    setIsOpen(false);
    setIsSaving(false);
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-medium text-brand-red underline-offset-2 hover:underline"
      >
        Registrar queja por WhatsApp
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 rounded-md border border-black/10 bg-background p-3 dark:border-white/10"
    >
      {error ? <p className="mb-2 text-xs text-brand-red">{error}</p> : null}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Describe lo que el cliente reportó por WhatsApp..."
        className="w-full rounded-md border border-black/15 bg-surface px-2.5 py-2 text-xs text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
        disabled={isSaving}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={isSaving || !description.trim()}
          className="rounded-md bg-brand-black px-3 py-1 text-xs font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-brand-black"
        >
          {isSaving ? "Guardando..." : "Registrar"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-md border border-black/15 px-3 py-1 text-xs font-medium text-foreground dark:border-white/15"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
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
        className="text-[13px] font-medium text-brand-red underline-offset-2 hover:underline"
      >
        Registrar queja por WhatsApp
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 rounded-xl border-[1.5px] border-seam bg-background p-3"
    >
      {error ? <p className="mb-2 text-[13px] text-brand-red">{error}</p> : null}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Describe lo que el cliente reportó por WhatsApp..."
        className="block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none"
        disabled={isSaving}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={isSaving || !description.trim()}
          className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-3 py-1 text-[13px] font-semibold text-ink disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Registrar"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-xl border-[1.5px] border-field-border px-3 py-1 text-[13px] font-medium text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
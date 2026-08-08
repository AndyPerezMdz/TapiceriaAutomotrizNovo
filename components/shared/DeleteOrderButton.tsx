"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteOrderButton({
  orderId,
  redirectTo,
}: {
  orderId: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar este pedido? Ya no podrás consultar su información, aunque seguirá apareciendo en el historial.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_order", {
      order_id: orderId,
    });

    if (error) {
      alert("No se pudo eliminar el pedido. Intenta de nuevo.");
      setIsDeleting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-brand-red/30 px-4 py-2.5 text-sm font-medium text-brand-red transition hover:bg-brand-red/5 disabled:opacity-60"
    >
      <Trash2 size={16} />
      {isDeleting ? "Eliminando..." : "Eliminar pedido"}
    </button>
  );
}
"use client";
import { buttonClass } from "@/components/taller";

import { useConfirm } from "@/lib/hooks/useConfirm";
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
  const { confirm, dialog } = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar pedido",
      description:
        "Este pedido se marcará como eliminado. Seguirá visible en el historial, pero ya no se podrá consultar su detalle.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_order", { order_id: orderId });

    if (error) {
      setIsDeleting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      {dialog}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={buttonClass("danger")}
      >
        <Trash2 size={17} /> {isDeleting ? "Eliminando..." : "Eliminar pedido"}
      </button>
    </>
  );
}
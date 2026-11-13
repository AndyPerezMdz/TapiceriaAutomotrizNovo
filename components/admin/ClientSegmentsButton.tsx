"use client";

import { ClientSegmentsDialog } from "@/components/admin/ClientSegmentsDialog";
import { buttonClass } from "@/components/taller";
import type { SegmentedClient } from "@/lib/coupons/audience";
import { Users } from "lucide-react";
import { useCallback, useState } from "react";

/** Botón que abre la ventana de clientes por categoría. */
export function ClientSegmentsButton({ clients }: { clients: SegmentedClient[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("outline")}>
        <Users size={18} /> Ver clientes por categoría
      </button>
      <ClientSegmentsDialog clients={clients} open={open} onClose={close} />
    </>
  );
}

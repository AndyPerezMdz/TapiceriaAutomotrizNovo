"use client";

import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, HardDrive, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PurgeOrdersButton({ deletedCount }: { deletedCount: number }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurge() {
    setIsPurging(true);
    setError(null);

    const supabase = createClient();
    const { data, error: purgeError } = await supabase.rpc("purge_deleted_orders", {
      p_older_than_days: 30,
    });

    if (purgeError) {
      setError("No se pudo completar la purga. Intenta de nuevo.");
      setIsPurging(false);
      return;
    }

    setResult(data);
    setIsPurging(false);
    router.refresh();
  }

  if (deletedCount === 0) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <div className="flex items-start gap-3">
        <HardDrive size={20} className="mt-0.5 shrink-0 text-muted" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {deletedCount} pedido(s) eliminado(s) en tu base de datos
          </p>
          <p className="mt-1 text-xs text-muted">
            Los pedidos eliminados siguen ocupando espacio de almacenamiento
            aunque no se muestren. Los que llevan más de 30 días se borran
            automáticamente el día 1 de cada mes, pero también puedes
            hacerlo manualmente ahora.
          </p>

          {!isOpen ? (
            <button
              onClick={() => setIsOpen(true)}
              className="mt-3 flex items-center gap-1.5 rounded-md border border-brand-red/30 px-3 py-1.5 text-xs font-medium text-brand-red transition hover:bg-brand-red/5"
            >
              <Trash2 size={13} /> Borrar pedidos eliminados
            </button>
          ) : (
            <div className="mt-3 rounded-md border border-brand-red/30 bg-brand-red/5 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brand-red" />
                <p className="text-sm text-brand-red">
                  Esto borrará <strong>permanentemente</strong> los pedidos con
                  más de 30 días marcados como eliminados (incluyendo sus fotos
                  y seguimiento). Esta acción no se puede deshacer.
                </p>
              </div>

              {error ? (
                <p className="mt-2 text-xs text-brand-red">{error}</p>
              ) : null}

              {result !== null ? (
                <p className="mt-2 text-xs font-medium text-foreground">
                  Listo: se borraron {result} pedido(s).
                </p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handlePurge}
                    disabled={isPurging}
                    className="rounded-md bg-brand-red px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-red-dark disabled:opacity-60"
                  >
                    {isPurging ? "Borrando..." : "Sí, borrar permanentemente"}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={isPurging}
                    className="rounded-md border border-black/15 px-4 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 dark:border-white/15"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuoteResponse({
  orderId,
  estimatedPrice,
}: {
  orderId: string;
  estimatedPrice: number | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<"aprobado" | "rechazado" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(newStatus: "aprobado" | "rechazado") {
    setIsLoading(newStatus);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("client_respond_to_quote", {
      order_id: orderId,
      new_status: newStatus,
    });

    if (rpcError) {
      setError("No se pudo registrar tu respuesta. Intenta de nuevo.");
      setIsLoading(null);
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-5">
      <p className="font-medium text-foreground">Tienes una cotización pendiente</p>
      {estimatedPrice ? (
        <p className="mt-1 text-2xl font-bold text-foreground">
          ${estimatedPrice.toLocaleString("es-MX")}
        </p>
      ) : null}
      <p className="mt-1 text-sm text-muted">
        ¿Deseas continuar con este trabajo?
      </p>

      {error ? (
        <p className="mt-2 text-sm text-brand-red">{error}</p>
      ) : null}

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => respond("aprobado")}
          disabled={isLoading !== null}
          className="flex-1 rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
        >
          {isLoading === "aprobado" ? "Enviando..." : "Aceptar cotización"}
        </button>
        <button
          onClick={() => respond("rechazado")}
          disabled={isLoading !== null}
          className="flex-1 rounded-md border border-black/15 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
        >
          {isLoading === "rechazado" ? "Enviando..." : "Rechazar"}
        </button>
      </div>
    </div>
  );
}
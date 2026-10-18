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
    <div className="rounded-[18px] border-2 border-dashed border-brand-yellow-dark/60 bg-highlight p-5 sm:p-7 dark:border-brand-yellow/50">
      <p className="font-display text-[28px] font-bold uppercase leading-none text-foreground">Tu cotización está lista</p>
      {estimatedPrice ? (
        <p className="mt-3 font-display text-5xl font-extrabold leading-none text-foreground">
          ${estimatedPrice.toLocaleString("es-MX")}
        </p>
      ) : null}
      <p className="mt-2 text-base text-muted">
        ¿Le entramos? Si la aceptas, agendamos tu coche y empezamos.
      </p>

      {error ? (
        <p className="mt-3 text-sm text-brand-red-dark dark:text-brand-red">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => respond("aprobado")}
          disabled={isLoading !== null}
          className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-brand-yellow px-6 text-base font-bold text-ink transition hover:bg-[#e8b90f] disabled:opacity-60 sm:flex-none"
        >
          {isLoading === "aprobado" ? "Enviando..." : "Aceptar cotización"}
        </button>
        <button
          onClick={() => respond("rechazado")}
          disabled={isLoading !== null}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-[1.5px] border-foreground px-6 text-base font-semibold text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
        >
          {isLoading === "rechazado" ? "Enviando..." : "No, gracias"}
        </button>
      </div>
    </div>
  );
}
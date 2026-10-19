"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle size={36} className="text-yellow-text" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">Algo salió mal</h1>
        <p className="mt-1 max-w-sm text-[15px] text-muted">
          Tuvimos un problema al cargar esta sección. Intenta de nuevo en un momento.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition min-h-11 inline-flex items-center justify-center"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/portal"
          className="rounded-xl border-[1.5px] border-field-border px-6 py-2.5 text-[15px] font-semibold text-foreground transition hover:bg-black/5 dark:hover:bg-white/5 min-h-11 inline-flex items-center justify-center"
        >
          Ir a Mis pedidos
        </Link>
      </div>
    </div>
  );
}
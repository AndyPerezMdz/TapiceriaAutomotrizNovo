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
      <AlertTriangle size={36} className="text-brand-yellow-dark dark:text-brand-yellow" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">Algo salió mal</h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Tuvimos un problema al cargar esta sección. Intenta de nuevo en un momento.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/portal"
          className="rounded-md border border-black/15 px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
        >
          Ir a Mis pedidos
        </Link>
      </div>
    </div>
  );
}
"use client";

import { businessInfo } from "@/lib/constants/business";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Image
        src="/images/logo-negro-wbg.png"
        alt={businessInfo.name}
        width={160}
        height={64}
        className="h-auto w-[140px]"
      />

      <div>
        <AlertTriangle
          size={40}
          className="mx-auto mb-3 text-brand-yellow-dark dark:text-brand-yellow"
        />
        <h1 className="text-xl font-semibold text-foreground">
          Algo salió mal
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Tuvimos un problema al cargar esta página. Puedes intentar de nuevo,
          o volver al inicio.
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
          href="/"
          className="rounded-md border border-black/15 px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
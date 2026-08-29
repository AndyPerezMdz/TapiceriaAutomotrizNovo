import { businessInfo } from "@/lib/constants/business";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
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
        <p className="text-6xl font-bold text-brand-yellow-dark dark:text-brand-yellow">
          404
        </p>
        <h1 className="mt-3 text-xl font-semibold text-foreground">
          Esta página no existe
        </h1>
        <p className="mt-2 text-sm text-muted">
          Puede que el enlace esté roto, o que la página se haya movido.
        </p>
      </div>

      <Link
        href="/"
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
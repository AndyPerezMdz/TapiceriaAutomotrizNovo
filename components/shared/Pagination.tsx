import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const base =
    "inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[1.5px] px-4 text-[15px] font-semibold transition";

  return (
    <nav aria-label="Paginación" className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[15px] text-muted">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={buildHref(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage === 1}
          className={`${base} border-field-border bg-surface text-foreground hover:border-foreground ${
            currentPage === 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <ChevronLeft size={17} /> Anterior
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage === totalPages}
          className={`${base} border-foreground bg-surface text-foreground hover:bg-black/5 dark:hover:bg-white/5 ${
            currentPage === totalPages ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Siguiente <ChevronRight size={17} />
        </Link>
      </div>
    </nav>
  );
}

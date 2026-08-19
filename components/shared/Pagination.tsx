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

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        className={`flex h-9 w-9 items-center justify-center rounded-md border border-black/15 text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5 ${
          currentPage === 1 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronLeft size={16} />
      </Link>
      <span className="text-sm text-muted">
        Página {currentPage} de {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        className={`flex h-9 w-9 items-center justify-center rounded-md border border-black/15 text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5 ${
          currentPage === totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
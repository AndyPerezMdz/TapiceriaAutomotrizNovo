import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Parte de abajo del ticket, después de la costura con muescas. */
  stub?: ReactNode;
  className?: string;
}

/**
 * Cabecera negra con forma de orden de trabajo: costura punteada y
 * dos muescas laterales del color del fondo.
 */
export function Ticket({ children, stub, className = "" }: Props) {
  return (
    <section
      className={`relative overflow-hidden rounded-[20px] bg-ink text-on-ink dark:ring-1 dark:ring-white/10 ${className}`}
    >
      <div className="px-5 pt-6 sm:px-10 sm:pt-9">{children}</div>
      {stub ? (
        <>
          <div className="relative my-5 sm:my-7" aria-hidden="true">
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
            <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
            <div className="mx-5 border-t-2 border-dashed border-brand-yellow/50 sm:mx-10" />
          </div>
          <div className="px-5 pb-6 sm:px-10 sm:pb-8">{stub}</div>
        </>
      ) : (
        <div className="pb-6 sm:pb-9" />
      )}
    </section>
  );
}

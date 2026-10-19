interface Props {
  /** Número de etapas del servicio. */
  total: number;
  /** Índice (0-based) de la etapa actual; -1 si aún no inicia. */
  currentIndex: number;
  /** Todas terminadas (pedido listo o entregado). */
  completed?: boolean;
  /** Sobre fondo negro (ticket). */
  onInk?: boolean;
  className?: string;
}

/** Barrita segmentada: una pieza por etapa. */
export function StageBar({ total, currentIndex, completed = false, onInk = false, className = "" }: Props) {
  if (total <= 0) return null;
  const reached = completed ? total - 1 : currentIndex;
  const empty = onInk ? "bg-[#3a3936]" : "bg-seam";

  return (
    <div
      className={`flex gap-1 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={reached + 1}
      aria-label="Avance del servicio"
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i <= reached ? "bg-brand-yellow" : empty}`}
        />
      ))}
    </div>
  );
}

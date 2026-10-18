import { Check } from "lucide-react";

export interface ProgressStage {
  id: string;
  name: string;
  client_description: string | null;
}

interface Props {
  stages: ProgressStage[];
  currentStageId: string | null;
  /** El pedido ya está listo o entregado: todas las etapas se muestran como completadas. */
  completed?: boolean;
}

/**
 * Barra de avance de un servicio dentro de un pedido, pensada para el cliente.
 * Las etapas deben llegar ya ordenadas.
 */
export function ServiceStageProgress({ stages, currentStageId, completed = false }: Props) {
  if (stages.length === 0) return null;

  const foundIndex = stages.findIndex((s) => s.id === currentStageId);
  const currentIndex = completed ? stages.length - 1 : foundIndex;
  const current = currentIndex === -1 ? null : stages[currentIndex];
  const next = completed ? null : stages[currentIndex + 1] ?? null;

  return (
    <div className="mt-2">
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={stages.length}
        aria-valuenow={currentIndex + 1}
        aria-label="Avance del servicio"
      >
        {stages.map((stage, i) => (
          <div
            key={stage.id}
            title={stage.name}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? "bg-brand-yellow" : "bg-black/10 dark:bg-white/10"
            }`}
          />
        ))}
      </div>

      {completed ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-foreground">
          <Check size={12} className="text-brand-yellow-dark dark:text-brand-yellow" />
          Todas las etapas terminadas
        </p>
      ) : current ? (
        <>
          <p className="mt-1.5 text-xs text-muted">
            Etapa {currentIndex + 1} de {stages.length}:{" "}
            <span className="font-medium text-foreground">{current.name}</span>
          </p>
          {current.client_description ? (
            <p className="mt-0.5 break-words text-xs text-muted">{current.client_description}</p>
          ) : null}
          {next ? <p className="mt-0.5 text-xs text-muted">Sigue: {next.name}</p> : null}
        </>
      ) : (
        <p className="mt-1.5 text-xs text-muted">
          Aún no empezamos este servicio. Primera etapa: {stages[0].name}
        </p>
      )}
    </div>
  );
}

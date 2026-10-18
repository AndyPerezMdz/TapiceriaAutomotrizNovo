import { Check, Scissors } from "lucide-react";

export interface StepperStage {
  id: string;
  name: string;
  client_description: string | null;
}

interface Props {
  stages: StepperStage[];
  currentStageId: string | null;
  /** Pedido listo o entregado: todas las etapas cuentan como terminadas. */
  completed?: boolean;
  /** Texto bajo la etapa actual, p. ej. "En curso desde 15 oct". */
  currentSince?: string | null;
}

type StepState = "done" | "current" | "pending";

function Circle({ state, n, small = false }: { state: StepState; n: number; small?: boolean }) {
  const size = small ? "h-[34px] w-[34px] text-base" : "h-10 w-10 text-lg";
  if (state === "done") {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-full bg-ink dark:bg-brand-yellow ${size}`}>
        <Check size={small ? 17 : 20} strokeWidth={3} className="text-brand-yellow dark:text-ink" />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand-yellow font-display font-extrabold text-ink shadow-[0_0_0_6px_rgba(245,197,24,0.28)] ${size}`}
      >
        {n}
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-field-border font-display font-bold text-muted ${size}`}
    >
      {n}
    </div>
  );
}

/** Avance grande de un servicio: horizontal en pantallas medianas, vertical en celular. */
export function StageStepper({ stages, currentStageId, completed = false, currentSince }: Props) {
  if (stages.length === 0) return null;

  const found = stages.findIndex((s) => s.id === currentStageId);
  const currentIndex = completed ? stages.length : found;
  const current = !completed && found !== -1 ? stages[found] : null;
  const next = current ? stages[found + 1] ?? null : null;

  function stateOf(i: number): StepState {
    if (i < currentIndex) return "done";
    if (i === currentIndex) return "current";
    return "pending";
  }

  function caption(i: number) {
    const st = stateOf(i);
    if (st === "done") return <p className="mt-0.5 text-sm text-muted">Terminado</p>;
    if (st === "current")
      return (
        <p className="mt-0.5 text-sm font-semibold text-yellow-text">
          {currentSince ?? "En curso"}
        </p>
      );
    return null;
  }

  return (
    <div>
      {/* Horizontal */}
      <ol
        className="hidden sm:grid"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
      >
        {stages.map((stage, i) => {
          const st = stateOf(i);
          const last = i === stages.length - 1;
          return (
            <li key={stage.id} className="flex flex-col gap-3" aria-current={st === "current" ? "step" : undefined}>
              <div className="flex items-center">
                <Circle state={st} n={i + 1} />
                {!last ? (
                  st === "done" ? (
                    <div className="h-[3px] flex-1 bg-ink dark:bg-brand-yellow" />
                  ) : (
                    <div className="flex-1 border-t-[3px] border-dashed border-seam" />
                  )
                ) : null}
              </div>
              <div className="pr-4">
                <p className={`text-base ${st === "current" ? "font-bold" : "font-semibold"} ${st === "pending" ? "text-muted" : "text-foreground"}`}>
                  {stage.name}
                </p>
                {caption(i)}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Vertical */}
      <ol className="sm:hidden">
        {stages.map((stage, i) => {
          const st = stateOf(i);
          const last = i === stages.length - 1;
          return (
            <li key={stage.id} className="flex gap-3.5" aria-current={st === "current" ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <Circle state={st} n={i + 1} small />
                {!last ? (
                  st === "done" ? (
                    <div className="min-h-4 w-[3px] flex-1 bg-ink dark:bg-brand-yellow" />
                  ) : (
                    <div className="mt-1.5 min-h-4 flex-1 border-l-[3px] border-dashed border-seam" />
                  )
                ) : null}
              </div>
              <div className={`min-w-0 pt-1.5 ${last ? "" : "pb-4"}`}>
                <p className={`text-base ${st === "current" ? "font-bold" : "font-semibold"} ${st === "pending" ? "text-muted" : "text-foreground"}`}>
                  {stage.name}
                </p>
                {caption(i)}
              </div>
            </li>
          );
        })}
      </ol>

      {completed ? (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-highlight px-5 py-4 text-base font-semibold text-foreground">
          <Check size={18} strokeWidth={3} className="text-yellow-text" /> Todas las etapas terminadas
        </p>
      ) : current ? (
        <div className="mt-6 flex items-start gap-3.5 rounded-xl bg-highlight px-5 py-4">
          <Scissors size={22} className="mt-0.5 shrink-0 text-yellow-text" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-foreground">Ahora mismo</p>
            <p className="mt-1 text-base leading-relaxed text-foreground/85">
              {current.client_description || `Estamos en la etapa de ${current.name.toLowerCase()}.`}
              {next ? ` Sigue: ${next.name.toLowerCase()}.` : ""}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-[15px] text-muted">Aún no empezamos este servicio.</p>
      )}
    </div>
  );
}

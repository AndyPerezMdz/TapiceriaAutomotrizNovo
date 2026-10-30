import type { UiMode } from "@/lib/a11y/preferences";

/** Bloque gris que simula una línea de texto. */
function Line({ w, className = "" }: { w: string; className?: string }) {
  return <span className={`block h-1.5 rounded-full ${className}`} style={{ width: w }} />;
}

/**
 * Miniatura de cómo se ve el inicio del portal en cada modo.
 * Es solo ilustrativa (aria-hidden): dibuja la estructura, no datos reales.
 */
export function ModePreview({ mode }: { mode: UiMode }) {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden rounded-xl border-2 border-black/10 bg-[#f3f1ec] p-2.5 shadow-inner"
    >
      {/* Barra del navegador */}
      <div className="mb-2 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
        <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
        <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
        <span className="ml-1 h-2 flex-1 rounded-full bg-black/10" />
      </div>

      {mode === "sencillo" ? (
        <div className="space-y-1.5">
          <span className="block font-display text-[1.25rem] font-extrabold uppercase leading-none text-[#1a1a1a]">
            Hola, Juan
          </span>
          <div className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-2 py-2">
            <span className="h-4 w-4 shrink-0 rounded-full bg-[#1a1a1a]" />
            <Line w="60%" className="!h-2 bg-[#1a1a1a]/70" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-2 py-2">
            <span className="h-4 w-4 shrink-0 rounded-full bg-[#f5c518]" />
            <Line w="55%" className="!h-2 bg-white/70" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border-2 border-[#1a1a1a] px-2 py-1.5">
            <span className="h-4 w-4 shrink-0 rounded-full bg-[#25D366]" />
            <Line w="50%" className="!h-2 bg-[#1a1a1a]/70" />
          </div>
          <div className="rounded-lg border-2 border-dashed border-black/20 px-2 py-1.5">
            <Line w="35%" className="bg-black/30" />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-display text-[0.875rem] font-extrabold uppercase leading-none text-[#1a1a1a]">
              Hola, Juan
            </span>
            <span className="h-3 w-10 rounded bg-[#1a1a1a]" />
          </div>
          <div className="rounded-lg bg-[#1a1a1a] px-2 py-1.5">
            <div className="flex items-center justify-between">
              <Line w="40%" className="bg-white/70" />
              <span className="h-2 w-6 -rotate-6 rounded-sm border border-[#f5c518]" />
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              {[0, 1, 2, 3].map((n) => (
                <span key={n} className="flex flex-1 items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${n < 2 ? "bg-white" : n === 2 ? "bg-[#f5c518]" : "bg-white/25"}`} />
                  {n < 3 ? <span className="h-px flex-1 border-t border-dashed border-white/30" /> : null}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="space-y-1 rounded-md bg-white p-1.5">
              <Line w="70%" className="bg-black/20" />
              <Line w="45%" className="!h-2.5 bg-[#1a1a1a]" />
            </div>
            <div className="space-y-1 rounded-md bg-white p-1.5">
              <Line w="60%" className="bg-black/20" />
              <Line w="35%" className="!h-2.5 bg-[#1a1a1a]" />
            </div>
            <div className="space-y-1 rounded-md bg-[#f5c518] p-1.5">
              <Line w="60%" className="bg-black/30" />
              <Line w="50%" className="!h-2.5 bg-[#1a1a1a]" />
            </div>
          </div>
          <div className="space-y-1 rounded-md bg-white p-1.5">
            <Line w="80%" className="bg-black/15" />
            <Line w="65%" className="bg-black/15" />
          </div>
        </div>
      )}
    </div>
  );
}

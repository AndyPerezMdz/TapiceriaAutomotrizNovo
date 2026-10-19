import Link from "next/link";

export default function NotFound() {
  return (
    <div className="dark">
      <main className="theme-taller flex min-h-screen items-center justify-center bg-[#141413] px-5 py-12 text-on-ink">
        <div className="w-full max-w-[520px] text-center">
          <span className="font-display text-3xl font-extrabold uppercase leading-none">Novo</span>

          <section className="relative mt-7 overflow-hidden rounded-[20px] bg-[#232220] px-6 pb-9 pt-10 sm:px-10">
            <span className="inline-block -rotate-6 rounded-lg border-[3px] border-brand-yellow px-4 py-1 font-display text-6xl font-extrabold leading-none text-brand-yellow sm:text-7xl">
              404
            </span>
            <h1 className="mt-7 font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl">
              Esta pieza no está en el taller
            </h1>
            <div className="mx-auto mt-6 max-w-xs border-t-2 border-dashed border-[#3d3b36]" />
            <p className="mt-5 text-base text-[#d9d5cc]">
              Puede que el enlace esté roto o que la página se haya movido.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center rounded-xl bg-brand-yellow px-6 text-base font-bold text-ink transition hover:bg-[#e8b90f]"
              >
                Volver al inicio
              </Link>
              <Link
                href="/portal"
                className="inline-flex min-h-12 items-center rounded-xl border-[1.5px] border-white/30 px-6 text-base font-semibold text-on-ink transition hover:border-white/60"
              >
                Ir a mi portal
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

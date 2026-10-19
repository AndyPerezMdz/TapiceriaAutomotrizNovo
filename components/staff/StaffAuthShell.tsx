import type { ReactNode } from "react";

/** Campo oscuro de las pantallas de acceso del staff. */
export const staffFieldClass =
  "block min-h-12 w-full rounded-[10px] border-[1.5px] border-[#3d3b36] bg-[#1a1a19] px-3.5 text-base text-[#f5f5f5] outline-none transition focus:border-brand-yellow disabled:opacity-60";
export const staffLabelClass = "mb-1.5 block text-[15px] font-semibold text-[#e6e3dc]";
export const staffButtonClass =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand-yellow px-6 text-[17px] font-bold text-ink transition hover:bg-[#e8b90f] disabled:opacity-60";
export const staffErrorClass =
  "rounded-[10px] border-[1.5px] border-brand-red-dark bg-brand-red/10 px-4 py-3 text-[15px] text-[#ffb4b4]";

interface Props {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Cascarón del "gafete" que usan las pantallas de acceso del staff. */
export function StaffAuthShell({ eyebrow, title, children, footer }: Props) {
  return (
    <div className="dark">
      <main className="theme-taller flex min-h-screen items-center justify-center bg-[#141413] px-5 py-12 text-on-ink">
        <div className="w-full max-w-[480px]">
          <div className="flex items-center justify-center gap-2.5">
            <span className="font-display text-3xl font-extrabold uppercase leading-none">Novo</span>
            <span className="rounded-[5px] bg-brand-yellow px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Taller
            </span>
          </div>

          <section className="mt-7 overflow-hidden rounded-[20px] bg-[#232220]">
            <div className="bg-brand-yellow px-6 pb-5 pt-6 text-ink sm:px-8">
              <p className="font-display text-sm font-bold uppercase tracking-[0.18em]">{eyebrow}</p>
              <h1 className="mt-1.5 font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-[44px]">{title}</h1>
            </div>
            <div className="relative" aria-hidden="true">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#141413]" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#141413]" />
            </div>
            <div className="px-6 pb-8 pt-6 sm:px-8">{children}</div>
          </section>

          {footer ? <div className="mt-5 text-center text-sm text-on-ink-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

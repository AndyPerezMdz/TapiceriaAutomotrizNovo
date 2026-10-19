import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

/** Plantilla de las páginas legales (aviso de privacidad, términos). */
export function LegalPage({ title, children }: Props) {
  const updated = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Merida",
  });

  return (
    <>
      <section className="bg-ink text-on-ink">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-14 sm:pt-20">
          <p className="font-display text-[15px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">Letra chiquita, bien clara</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-extrabold uppercase leading-[0.9] sm:text-7xl">{title}</h1>
          <div className="mt-7 border-t-2 border-dashed border-brand-yellow/45" />
          <p className="mt-4 text-sm text-on-ink-muted">Última actualización: {updated}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-16">
        <div className="legal-sections space-y-0 text-[16px] leading-[1.7] text-foreground/80 [counter-reset:legal] [&_a]:font-semibold [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&>section+section]:mt-8 [&>section+section]:border-t-2 [&>section+section]:border-dashed [&>section+section]:border-seam [&>section+section]:pt-8 [&>section>h2]:mb-3 [&>section>h2]:flex [&>section>h2]:items-baseline [&>section>h2]:gap-3 [&>section>h2]:font-display [&>section>h2]:text-[28px] [&>section>h2]:font-bold [&>section>h2]:uppercase [&>section>h2]:leading-none [&>section>h2]:text-foreground [&>section>h2]:[counter-increment:legal] [&>section>h2]:before:font-display [&>section>h2]:before:text-[28px] [&>section>h2]:before:font-extrabold [&>section>h2]:before:text-yellow-text [&>section>h2]:before:content-[counter(legal,decimal-leading-zero)]">
          {children}
        </div>
      </div>
    </>
  );
}

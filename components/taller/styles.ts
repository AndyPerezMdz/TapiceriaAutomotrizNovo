/**
 * Clases compartidas del rediseño "taller".
 * Úsalas en <input>, <Link>, <button>… cuando no convenga un componente.
 */

type ButtonVariant = "primary" | "ink" | "outline" | "ghost" | "danger";
type ButtonSize = "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-yellow text-ink hover:bg-[#e8b90f]",
  ink: "bg-ink text-brand-yellow hover:bg-ink-soft dark:ring-1 dark:ring-white/10",
  outline:
    "border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/5",
  ghost: "bg-transparent text-foreground underline-offset-4 hover:underline",
  danger:
    "border-[1.5px] border-brand-red-dark bg-transparent text-brand-red-dark hover:bg-brand-red/5 dark:border-brand-red dark:text-brand-red",
};

const buttonSizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-[52px] px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`;
}

export const labelClass = "mb-1.5 block text-[15px] font-semibold text-foreground";

export const fieldClass =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none aria-[invalid=true]:border-brand-red-dark aria-[invalid=true]:bg-brand-red/5";

export const textareaClass = `${fieldClass} py-3 leading-relaxed`;

export const fieldErrorClass = "mt-1.5 text-sm text-brand-red-dark dark:text-brand-red";

/** Tarjeta blanca base. */
export const cardClass =
  "rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5";

/** Línea de costura para separar secciones. */
export const seamClass = "border-t-2 border-dashed border-seam";

/** Etiqueta pequeña en mayúsculas (FOLIO, TOTAL…). */
export const eyebrowClass = "text-xs uppercase tracking-[0.14em] text-muted";

/** Número o título grande condensado. */
export const displayClass = "font-display font-extrabold uppercase leading-[0.95]";

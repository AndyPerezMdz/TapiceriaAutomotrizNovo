import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  active?: boolean;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}

const base =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow";
const on = "bg-ink font-semibold text-brand-yellow dark:ring-1 dark:ring-white/10";
const off =
  "border-[1.5px] border-field-border bg-surface text-foreground hover:border-foreground";

/** Filtro o selección en forma de pastilla. Con `href` es link; si no, botón. */
export function Pill({ active = false, href, onClick, children }: Props) {
  const cls = `${base} ${active ? on : off}`;
  if (href) {
    return (
      <Link href={href} className={cls} aria-current={active ? "page" : undefined}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-pressed={active}>
      {children}
    </button>
  );
}

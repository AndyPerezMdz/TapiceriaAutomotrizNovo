import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-black/15 bg-surface px-6 py-14 text-center dark:border-white/15">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow">
        <Icon size={26} />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-5 rounded-md bg-brand-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
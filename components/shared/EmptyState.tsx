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
    <div className="flex flex-col items-center rounded-[18px] border-2 border-dashed border-field-border bg-surface px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-brand-yellow">
        <Icon size={26} />
      </div>
      <p className="font-display text-2xl font-bold uppercase text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-yellow px-6 text-[15px] font-semibold text-ink transition hover:bg-[#e8b90f]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
import { FileText } from "lucide-react";

export function DownloadManualCard({
  title,
  description,
  fileUrl,
}: {
  title: string;
  description: string;
  fileUrl: string;
}) {
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-yellow/20 text-brand-yellow-dark dark:text-brand-yellow">
        <FileText size={18} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </a>
  );
}
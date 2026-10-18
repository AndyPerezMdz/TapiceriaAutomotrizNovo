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
      className="flex items-center gap-3 rounded-2xl bg-surface p-5 sm:p-6 transition hover:border-brand-yellow-dark dark:hover:border-brand-yellow dark:ring-1 dark:ring-white/5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-highlight text-yellow-text">
        <FileText size={18} />
      </div>
      <div>
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        <p className="text-[13px] text-muted">{description}</p>
      </div>
    </a>
  );
}
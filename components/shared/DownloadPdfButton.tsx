import { FileText } from "lucide-react";

export function DownloadPdfButton({
  orderId,
  label,
}: {
  orderId: string;
  label: string;
}) {
  return (
    <a
      href={`/api/pdf/pedido/${orderId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-fit items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
    >
      <FileText size={14} /> {label}
    </a>
  );
}
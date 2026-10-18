import { buttonClass } from "@/components/taller";
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
      className={buttonClass("outline")}
    >
      <FileText size={17} /> {label}
    </a>
  );
}
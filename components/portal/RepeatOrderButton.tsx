import { Repeat } from "lucide-react";
import Link from "next/link";

export function RepeatOrderButton({ orderId }: { orderId: string }) {
  return (
    <Link
      href={`/portal/nuevo-pedido?repeat=${orderId}`}
      className="flex w-fit items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
    >
      <Repeat size={13} /> Repetir este pedido
    </Link>
  );
}
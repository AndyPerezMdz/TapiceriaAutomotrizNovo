import { buttonClass } from "@/components/taller";
import { Repeat } from "lucide-react";
import Link from "next/link";

export function RepeatOrderButton({ orderId }: { orderId: string }) {
  return (
    <Link
      href={`/portal/nuevo-pedido?repeat=${orderId}`}
      className={buttonClass("outline")}
    >
      <Repeat size={17} /> Repetir este pedido
    </Link>
  );
}
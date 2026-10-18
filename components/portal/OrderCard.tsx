import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusTag } from "@/components/taller";

interface Order {
  id: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year?: number | null;
  status: string;
  created_at: string;
  deleted_at: string | null;
  updated_at?: string;
  client_last_viewed_at?: string | null;
  estimated_price?: number | null;
  final_price?: number | null;
}

export function OrderCard({
  order,
}: {
  order: Order;
  /** Se conserva por compatibilidad; la etiqueta la pone StatusTag. */
  statusLabel?: string;
}) {
  const vehicle = [order.vehicle_make, order.vehicle_model, order.vehicle_year]
    .filter(Boolean)
    .join(" ");
  const date = new Date(order.created_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const total = order.final_price ?? order.estimated_price ?? null;

  const hasUpdate =
    !order.deleted_at &&
    order.updated_at &&
    (!order.client_last_viewed_at ||
      new Date(order.updated_at) > new Date(order.client_last_viewed_at));

  return (
    <Link
      href={`/portal/pedidos/${order.id}`}
      className="group flex min-h-[76px] items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4 transition hover:ring-2 hover:ring-foreground/80 sm:px-6 dark:ring-1 dark:ring-white/5"
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-foreground">
          {vehicle || "Pedido sin detalle de vehículo"}
          {hasUpdate ? (
            <span className="rounded-full bg-brand-red px-2 py-0.5 text-[11px] font-semibold text-white">
              Novedades
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[15px] text-muted">
          <span className="font-code text-[13px]">{order.id.slice(0, 8).toUpperCase()}</span> · {date}
          {total ? ` · $${Number(total).toLocaleString("es-MX")}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <StatusTag status={order.status} deleted={Boolean(order.deleted_at)} />
        <ChevronRight size={18} className="text-muted transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

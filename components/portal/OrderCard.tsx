import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { deletedBadgeClass, statusColors } from "@/lib/constants/order-status";

interface Order {
  id: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  status: string;
  created_at: string;
  deleted_at: string | null;
  updated_at?: string;
  client_last_viewed_at?: string | null;
}

export function OrderCard({
  order,
  statusLabel,
}: {
  order: Order;
  statusLabel: string;
}) {
  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");
  const date = new Date(order.created_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const hasUpdate =
    !order.deleted_at &&
    order.updated_at &&
    (!order.client_last_viewed_at ||
      new Date(order.updated_at) > new Date(order.client_last_viewed_at));

  return (
    <Link
      href={`/portal/pedidos/${order.id}`}
      className="relative flex items-center justify-between rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
    >
      {hasUpdate ? (
        <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-brand-red" />
      ) : null}

      <div>
        <p className="font-medium text-foreground">
          {vehicle || "Pedido sin detalle de vehículo"}
        </p>
        <p className="mt-0.5 text-xs text-muted">{date}</p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            order.deleted_at
              ? deletedBadgeClass
              : statusColors[order.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {order.deleted_at ? "Eliminado" : statusLabel}
        </span>
        <ChevronRight size={18} className="text-muted" />
      </div>
    </Link>
  );
}
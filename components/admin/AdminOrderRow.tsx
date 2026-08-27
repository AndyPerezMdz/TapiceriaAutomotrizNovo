import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { deletedBadgeClass, statusColors, statusLabels } from "@/lib/constants/order-status";

interface Order {
  id: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  status: string;
  created_at: string;
  client_name: string | null;
  client_avatar_url?: string | null;
  deleted_at: string | null;
}

export function AdminOrderRow({ order }: { order: Order }) {
  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");
  const date = new Date(order.created_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/admin/pedidos/${order.id}`}
      className="flex items-center justify-between rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
    >
      <div className="flex items-center gap-3">
        {order.client_avatar_url ? (
          <img
            src={order.client_avatar_url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-xs font-semibold text-brand-yellow-dark dark:text-brand-yellow">
            {order.client_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">
            {order.client_name ?? "Cliente"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {vehicle || "Sin detalle de vehículo"} · {date}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            order.deleted_at
              ? deletedBadgeClass
              : statusColors[order.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {order.deleted_at ? "Eliminado" : statusLabels[order.status] ?? order.status}
        </span>
        <ChevronRight size={18} className="text-muted" />
      </div>
    </Link>
  );
}
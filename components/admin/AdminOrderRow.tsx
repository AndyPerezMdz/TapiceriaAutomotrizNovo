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
      className="flex items-center justify-between rounded-2xl bg-surface p-5 sm:p-6 transition hover:border-brand-yellow-dark dark:hover:border-brand-yellow dark:ring-1 dark:ring-white/5"
    >
      <div className="flex items-center gap-3">
        {order.client_avatar_url ? (
          <img
            src={order.client_avatar_url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-highlight text-[13px] font-semibold text-yellow-text">
            {order.client_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">
            {order.client_name ?? "Cliente"}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {vehicle || "Sin detalle de vehículo"} · {date}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${
            order.deleted_at
              ? deletedBadgeClass
              : statusColors[order.status] ?? "border-[1.5px] border-muted text-muted"
          }`}
        >
          {order.deleted_at ? "Eliminado" : statusLabels[order.status] ?? order.status}
        </span>
        <ChevronRight size={18} className="text-muted" />
      </div>
    </Link>
  );
}
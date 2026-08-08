import { createClient } from "@/lib/supabase/server";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { OrderCard } from "@/components/portal/OrderCard";

const statusLabels: Record<string, string> = {
  pendiente_revision: "Pendiente de revisión",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  en_proceso: "En proceso",
  listo_para_entrega: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, vehicle_make, vehicle_model, status, created_at, deleted_at")
    .eq("client_id", user?.id)
    .order("created_at", { ascending: false });

  const activeOrders = orders?.filter(
    (o) => !["entregado", "cancelado", "rechazado"].includes(o.status),
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mis pedidos
          </h1>
          <p className="mt-1 text-sm text-muted">
            Seguimiento de tus cotizaciones y trabajos en proceso.
          </p>
        </div>
        <Link
          href="/portal/nuevo-pedido"
          className="flex items-center gap-1.5 rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
        >
          <PlusCircle size={16} /> Nuevo pedido
        </Link>
      </div>

      {!activeOrders || activeOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">Aún no tienes pedidos registrados.</p>
          <Link
            href="/portal/nuevo-pedido"
            className="mt-4 inline-block text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow"
          >
            Solicita tu primera cotización
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              statusLabel={statusLabels[order.status] ?? order.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
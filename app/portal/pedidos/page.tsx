import { OrderCard } from "@/components/portal/OrderCard";
import { createClient } from "@/lib/supabase/server";

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

export default async function HistorialPedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, vehicle_make, vehicle_model, status, created_at, deleted_at")
    .eq("client_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Historial de pedidos
        </h1>
        <p className="mt-1 text-sm text-muted">
          Todos tus pedidos, incluyendo los ya entregados.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">Aún no tienes pedidos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
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
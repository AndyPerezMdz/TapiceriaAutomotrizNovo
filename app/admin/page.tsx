import { AdminOrderRow } from "@/components/admin/AdminOrderRow";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, vehicle_make, vehicle_model, status, created_at, deleted_at, profiles!orders_client_id_fkey(full_name)",
    )
    .in("status", ["pendiente_revision", "cotizado"])
    .order("created_at", { ascending: true });

  const formattedOrders =
    orders?.map((o) => ({
      id: o.id,
      vehicle_make: o.vehicle_make,
      vehicle_model: o.vehicle_model,
      status: o.status,
      created_at: o.created_at,
      deleted_at: o.deleted_at,
      client_name: (o.profiles as unknown as { full_name: string } | null)
        ?.full_name ?? null,
    })) ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pedidos que necesitan tu atención (pendientes o ya cotizados).
        </p>
      </div>

      {formattedOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No hay pedidos pendientes de revisión.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formattedOrders.map((order) => (
            <AdminOrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
import { AdminOrderRow } from "@/components/admin/AdminOrderRow";
import { createClient } from "@/lib/supabase/server";

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "pendiente_revision", label: "Pendientes" },
  { value: "cotizado", label: "Cotizados" },
  { value: "aprobado", label: "Aprobados" },
  { value: "en_proceso", label: "En proceso" },
  { value: "listo_para_entrega", label: "Listos" },
  { value: "entregado", label: "Entregados" },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const activeFilter = status ?? "all";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id, vehicle_make, vehicle_model, status, created_at, deleted_at, profiles!orders_client_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  const { data: orders } = await query;

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Todos los pedidos
        </h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <a
            key={filter.value}
            href={filter.value === "all" ? "/admin/pedidos" : `/admin/pedidos?status=${filter.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === filter.value
                ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      {formattedOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No hay pedidos en este filtro.</p>
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
import { OrderCard } from "@/components/portal/OrderCard";
import { OrderFilters } from "@/components/shared/OrderFilters";
import { Pagination } from "@/components/shared/Pagination";
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

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string; q?: string; from?: string; to?: string }>;
}

export default async function HistorialPedidosPage({ searchParams }: Props) {
  const { page: pageParam, q, from, to } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("orders")
    .select("id, vehicle_make, vehicle_model, status, created_at, deleted_at", {
      count: "exact",
    })
    .eq("client_id", user?.id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `vehicle_make.ilike.%${q}%,vehicle_model.ilike.%${q}%,service_description.ilike.%${q}%`,
    );
  }
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const { data: orders, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(targetPage));
    return `/portal/pedidos?${params.toString()}`;
  }

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

      <OrderFilters />

      {!orders || orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No se encontraron pedidos con estos filtros.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                statusLabel={statusLabels[order.status] ?? order.status}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
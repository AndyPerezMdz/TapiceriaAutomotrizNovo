import { OrderCard } from "@/components/portal/OrderCard";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
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

const groupFilters = [
  { value: "all", label: "Todos", statuses: [] as string[] },
  {
    value: "activos",
    label: "Activos",
    statuses: ["pendiente_revision", "cotizado", "aprobado", "en_proceso", "listo_para_entrega"],
  },
  { value: "entregados", label: "Entregados", statuses: ["entregado"] },
  { value: "cancelados", label: "Cancelados", statuses: ["cancelado", "rechazado"] },
];

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string; q?: string; group?: string }>;
}

export default async function HistorialPedidosPage({ searchParams }: Props) {
  const { page: pageParam, q, group } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const activeGroup = groupFilters.find((g) => g.value === group) ?? groupFilters[0];

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
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (activeGroup.statuses.length > 0) {
    query = query.in("status", activeGroup.statuses);
  }

  if (q) {
    query = query.or(
      `vehicle_make.ilike.%${q}%,vehicle_model.ilike.%${q}%,service_description.ilike.%${q}%`,
    );
  }

  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const { data: orders, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (activeGroup.value !== "all") params.set("group", activeGroup.value);
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

      <div className="mb-4">
        <SearchBar placeholder="Buscar por vehículo o descripción..." />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {groupFilters.map((g) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (g.value !== "all") params.set("group", g.value);
          const href = `/portal/pedidos?${params.toString()}`;

          return (
            <a
              key={g.value}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeGroup.value === g.value
                  ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                  : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
              }`}
            >
              {g.label}
            </a>
          );
        })}
      </div>

      {count !== null && count !== undefined ? (
        <p className="mb-4 text-xs text-muted">
          {count} pedido{count === 1 ? "" : "s"} encontrado{count === 1 ? "" : "s"}
        </p>
      ) : null}

      {!orders || orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">
            {q || activeGroup.value !== "all"
              ? "No se encontraron pedidos con estos filtros."
              : "Aún no tienes pedidos registrados."}
          </p>
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
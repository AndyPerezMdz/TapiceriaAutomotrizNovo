import { OrderCard } from "@/components/portal/OrderCard";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pill } from "@/components/taller";
import { createClient } from "@/lib/supabase/server";

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
    .select(
      "id, vehicle_make, vehicle_model, vehicle_year, status, created_at, deleted_at, updated_at, client_last_viewed_at, estimated_price, final_price",
      { count: "exact" },
    )
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
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-6xl">
          Historial
        </h1>
        <p className="mt-2.5 text-base text-muted">Todos tus pedidos, incluyendo los ya entregados.</p>
      </header>

      <SearchBar placeholder="Buscar por vehículo o descripción" />

      <div role="group" aria-label="Filtrar pedidos" className="flex flex-wrap gap-2">
        {groupFilters.map((g) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (g.value !== "all") params.set("group", g.value);
          return (
            <Pill
              key={g.value}
              href={`/portal/pedidos?${params.toString()}`}
              active={activeGroup.value === g.value}
            >
              {g.label}
            </Pill>
          );
        })}
      </div>

      {count !== null && count !== undefined ? (
        <p className="text-[15px] text-muted">
          {count} pedido{count === 1 ? "" : "s"}
        </p>
      ) : null}

      {!orders || orders.length === 0 ? (
        <div className="rounded-[18px] border-2 border-dashed border-field-border bg-surface px-6 py-16 text-center">
          <p className="text-base text-muted">
            {q || activeGroup.value !== "all"
              ? "No encontramos pedidos con estos filtros."
              : "Aún no tienes pedidos registrados."}
          </p>
        </div>
      ) : (
        <div>
          <div className="space-y-2.5">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      )}
    </div>
  );
}

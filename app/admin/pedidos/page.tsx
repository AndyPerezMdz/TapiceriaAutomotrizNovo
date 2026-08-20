import { AdminOrderRow } from "@/components/admin/AdminOrderRow";
import { AdvancedFilters } from "@/components/shared/AdvancedFilters";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
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

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{
    status?: string;
    page?: string;
    q?: string;
    from?: string;
    to?: string;
    min_price?: string;
    max_price?: string;
  }>;
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const { status, page: pageParam, q, from, to, min_price, max_price } = await searchParams;
  const activeFilter = status ?? "all";
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  // Si hay búsqueda, primero buscamos clientes cuyo nombre coincida,
  // para poder incluir sus pedidos aunque el vehículo/descripción no matcheen.
  let matchingClientIds: string[] = [];
  if (q) {
    const { data: matchingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .ilike("full_name", `%${q}%`);
    matchingClientIds = matchingProfiles?.map((p) => p.id) ?? [];
  }

  let query = supabase
    .from("orders")
    .select(
      "id, vehicle_make, vehicle_model, status, created_at, deleted_at, profiles!orders_client_id_fkey(full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  if (q) {
    const orConditions = [
      `vehicle_make.ilike.%${q}%`,
      `vehicle_model.ilike.%${q}%`,
      `service_description.ilike.%${q}%`,
    ];
    if (matchingClientIds.length > 0) {
      orConditions.push(`client_id.in.(${matchingClientIds.join(",")})`);
    }
    query = query.or(orConditions.join(","));
  }

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);
  if (min_price) query = query.gte("estimated_price", Number(min_price));
  if (max_price) query = query.lte("estimated_price", Number(max_price));

  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const { data: orders, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const formattedOrders =
    orders?.map((o) => ({
      id: o.id,
      vehicle_make: o.vehicle_make,
      vehicle_model: o.vehicle_model,
      status: o.status,
      created_at: o.created_at,
      deleted_at: o.deleted_at,
      client_name:
        (o.profiles as unknown as { full_name: string } | null)?.full_name ?? null,
    })) ?? [];

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (activeFilter !== "all") params.set("status", activeFilter);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (min_price) params.set("min_price", min_price);
    if (max_price) params.set("max_price", max_price);
    params.set("page", String(targetPage));
    return `/admin/pedidos?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Todos los pedidos
        </h1>
      </div>

      <div className="mb-6 flex gap-2">
        <div className="flex-1">
          <SearchBar placeholder="Buscar por vehículo, cliente o descripción..." />
        </div>
        <AdvancedFilters showPrice />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <a
            key={filter.value}
            href={
              filter.value === "all"
                ? "/admin/pedidos"
                : `/admin/pedidos?status=${filter.value}`
            }
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
          <p className="text-muted">No hay pedidos con estos filtros.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {formattedOrders.map((order) => (
              <AdminOrderRow key={order.id} order={order} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
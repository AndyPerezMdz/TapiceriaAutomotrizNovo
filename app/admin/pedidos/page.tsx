import { AdvancedFilters } from "@/components/shared/AdvancedFilters";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { createClient } from "@/lib/supabase/server";
import { Pill, StageBar, StatusTag, buttonClass, displayClass } from "@/components/taller";
import { Download } from "lucide-react";
import Link from "next/link";

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "pendiente_revision", label: "Por revisar" },
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
      "id, vehicle_make, vehicle_model, vehicle_year, status, created_at, deleted_at, estimated_price, final_price, profiles!orders_client_id_fkey(full_name, avatar_url), order_items(id, service_id, current_stage_id, order, services(title))",
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

  const countStatuses = statusFilters.filter((f) => f.value !== "all").map((f) => f.value);
  const [{ data: orders, count }, ...statusCounts] = await Promise.all([
    query,
    ...countStatuses.map((st) =>
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", st)
        .is("deleted_at", null),
    ),
  ]);
  const countByStatus: Record<string, number> = Object.fromEntries(
    countStatuses.map((st, i) => [st, statusCounts[i].count ?? 0]),
  );
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  interface Item {
    id: string;
    service_id: string | null;
    current_stage_id: string | null;
    order: number;
    services: { title: string } | null;
  }

  const allItems = (orders ?? []).flatMap((o) => (o.order_items ?? []) as unknown as Item[]);
  const serviceIds = [...new Set(allItems.map((i) => i.service_id).filter((x): x is string => Boolean(x)))];
  const { data: stagesData } = serviceIds.length
    ? await supabase
        .from("service_stages")
        .select("id, service_id, name, order, is_active")
        .in("service_id", serviceIds)
        .order("order", { ascending: true })
    : { data: [] };
  const stages = stagesData ?? [];

  function progressOf(items: Item[]) {
    for (const item of [...items].sort((a, b) => a.order - b.order)) {
      const list = stages.filter(
        (st) => st.service_id === item.service_id && (st.is_active || st.id === item.current_stage_id),
      );
      if (list.length === 0) continue;
      const idx = list.findIndex((st) => st.id === item.current_stage_id);
      return { name: idx === -1 ? null : list[idx].name, idx, total: list.length };
    }
    return null;
  }

  const formattedOrders =
    orders?.map((o) => {
      const client = o.profiles as unknown as { full_name: string; avatar_url: string | null } | null;
      const items = (o.order_items ?? []) as unknown as Item[];
      return {
        id: o.id,
        vehicle: [o.vehicle_make, o.vehicle_model, o.vehicle_year].filter(Boolean).join(" "),
        status: o.status,
        created_at: o.created_at,
        deleted_at: o.deleted_at,
        total: o.final_price ?? o.estimated_price,
        client_name: client?.full_name ?? null,
        services: items.map((i) => i.services?.title).filter(Boolean).join(", "),
        progress: progressOf(items),
      };
    }) ?? [];

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

  const allCount = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  function filterHref(value: string) {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
  }

  const th = "px-5 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className={`${displayClass} text-5xl text-foreground sm:text-6xl`}>Pedidos</h1>
        <a href="/api/admin/export/pedidos" className={buttonClass("outline")}>
          <Download size={17} /> Exportar CSV
        </a>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="min-w-0 flex-[1_1_280px]">
          <SearchBar placeholder="Buscar por vehículo, cliente o descripción" />
        </div>
        <AdvancedFilters showPrice />
      </div>

      <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <Pill key={filter.value} href={filterHref(filter.value)} active={activeFilter === filter.value}>
            {filter.label} · {filter.value === "all" ? allCount : countByStatus[filter.value] ?? 0}
          </Pill>
        ))}
      </div>

      {formattedOrders.length === 0 ? (
        <div className="rounded-[18px] border-2 border-dashed border-field-border bg-surface px-6 py-16 text-center">
          <p className="text-base text-muted">No hay pedidos con estos filtros.</p>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto rounded-[18px] bg-surface dark:ring-1 dark:ring-white/5">
            <table className="w-full min-w-[760px] border-collapse text-[15px]">
              <thead>
                <tr className="border-b-2 border-dashed border-seam">
                  <th scope="col" className={`${th} pl-6`}>Vehículo</th>
                  <th scope="col" className={th}>Cliente</th>
                  <th scope="col" className={th}>Etapa</th>
                  <th scope="col" className={th}>Estado</th>
                  <th scope="col" className={`${th} pr-6 text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {formattedOrders.map((o, i) => {
                  const done = o.status === "listo_para_entrega" || o.status === "entregado";
                  return (
                    <tr
                      key={o.id}
                      className={`transition hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                        i < formattedOrders.length - 1 ? "border-b border-seam" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-5 align-top">
                        <Link href={`/admin/pedidos/${o.id}`} className="block">
                          <span className="block text-base font-semibold text-foreground">
                            {o.vehicle || "Sin vehículo"}
                          </span>
                          <span className="mt-0.5 block text-[13px] text-muted">
                            <span className="font-code">{o.id.slice(0, 8).toUpperCase()}</span> ·{" "}
                            {new Date(o.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="block text-foreground">{o.client_name ?? "Cliente"}</span>
                        {o.services ? (
                          <span className="mt-0.5 block max-w-[220px] truncate text-[13px] text-muted">{o.services}</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {o.progress && !["pendiente_revision", "cotizado", "rechazado", "cancelado"].includes(o.status) ? (
                          <>
                            <span className="block font-semibold text-foreground">
                              {done ? "Terminado" : o.progress.name ?? "Sin iniciar"}
                            </span>
                            <StageBar
                              total={o.progress.total}
                              currentIndex={o.progress.idx}
                              completed={done}
                              className="mt-1.5 w-[120px]"
                            />
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <StatusTag status={o.status} deleted={Boolean(o.deleted_at)} />
                      </td>
                      <td className="py-4 pl-5 pr-6 text-right align-top">
                        {o.total ? (
                          <span className="font-display text-xl font-bold text-foreground">
                            ${Number(o.total).toLocaleString("es-MX")}
                          </span>
                        ) : (
                          <span className="text-muted">Sin cotizar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      )}
    </div>
  );
}

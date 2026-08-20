import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { createClient } from "@/lib/supabase/server";
import { Clock } from "lucide-react";

const actionColors: Record<string, string> = {
  "Cambio de estado": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Cambio de precio": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Eliminación": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "Servicio creado": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Servicio editado": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Servicio eliminado": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "Foto agregada": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Foto eliminada": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "Cambio de rol": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminHistorialPage({ searchParams }: Props) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("id, actor_name, action, entity_type, entity_label, details, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`actor_name.ilike.%${q}%,entity_label.ilike.%${q}%,action.ilike.%${q}%`);
  }

  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const { data: entries, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/admin/historial?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Historial de cambios
      </h1>

      <div className="mb-6">
        <SearchBar placeholder="Buscar por persona, acción o elemento..." />
      </div>

      {!entries || entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No hay resultados.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        actionColors[entry.action] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {entry.action}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {entry.entity_type}: {entry.entity_label}
                    </span>
                  </div>
                  {entry.details ? (
                    <p className="mt-1 break-words text-sm text-muted">{entry.details}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted">Por {entry.actor_name ?? "Sistema"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted">
                  <Clock size={12} />
                  {new Date(entry.created_at).toLocaleString("es-MX", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Merida",
                  })}
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
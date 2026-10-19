import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { createClient } from "@/lib/supabase/server";
import { Clock } from "lucide-react";

const actionColors: Record<string, string> = {
  "Cambio de estado": "bg-brand-yellow text-ink",
  "Cambio de precio": "border-[1.5px] border-dashed border-foreground text-foreground",
  "Eliminación": "border-[1.5px] border-brand-red-dark text-brand-red-dark dark:border-brand-red dark:text-brand-red",
  "Servicio creado": "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
  "Servicio editado": "bg-brand-yellow text-ink",
  "Servicio eliminado": "border-[1.5px] border-brand-red-dark text-brand-red-dark dark:border-brand-red dark:text-brand-red",
  "Foto agregada": "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
  "Foto eliminada": "border-[1.5px] border-brand-red-dark text-brand-red-dark dark:border-brand-red dark:text-brand-red",
  "Cambio de rol": "bg-brand-yellow text-ink",
  "Usuario desactivado": "border-[1.5px] border-brand-red-dark text-brand-red-dark dark:border-brand-red dark:text-brand-red",
"Usuario reactivado": "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
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
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-6 text-foreground">
        Historial de cambios
      </h1>

      <div className="mb-6">
        <SearchBar placeholder="Buscar por persona, acción o elemento..." />
      </div>

      {!entries || entries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-16 text-center">
          <p className="text-muted">No hay resultados.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-4 rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${
                        actionColors[entry.action] ?? "border-[1.5px] border-muted text-muted"
                      }`}
                    >
                      {entry.action}
                    </span>
                    <span className="text-[15px] font-medium text-foreground">
                      {entry.entity_type}: {entry.entity_label}
                    </span>
                  </div>
                  {entry.details ? (
                    <p className="mt-1 break-words text-[15px] text-muted">{entry.details}</p>
                  ) : null}
                  <p className="mt-1 text-[13px] text-muted">Por {entry.actor_name ?? "Sistema"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-[13px] text-muted">
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
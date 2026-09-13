import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

const statusFilters = [
  { value: "all", label: "Todas" },
  { value: "abierta", label: "Abiertas" },
  { value: "atendida", label: "Atendidas" },
  { value: "cerrada", label: "Cerradas" },
];

const statusColors: Record<string, string> = {
  abierta: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  atendida: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  cerrada: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminQuejasPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const activeFilter = status ?? "all";

  const supabase = await createClient();

  let query = supabase
    .from("complaints")
    .select("id, description, status, source, created_at, order_id, satisfaction_rating, profiles!complaints_client_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  const { data: complaints } = await query;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Quejas</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <a
            key={filter.value}
            href={filter.value === "all" ? "/admin/quejas" : `/admin/quejas?status=${filter.value}`}
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

      {!complaints || complaints.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <AlertTriangle size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-muted">No hay quejas con este filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const client = c.profiles as unknown as { full_name: string } | null;
            return (
              <Link
                key={c.id}
                href={`/admin/quejas/${c.id}`}
                className="block rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{client?.full_name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Calendar size={11} />
                      {new Date(c.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}Folio {c.order_id.slice(0, 8).toUpperCase()}
                      {" · "}
                      {c.source === "web" ? "En línea" : "WhatsApp"}
                    </p>
                    <p className="mt-1.5 truncate text-sm text-muted">{c.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                    {c.satisfaction_rating ? (
                      <span className="text-xs text-brand-yellow-dark dark:text-brand-yellow">
                        {"★".repeat(c.satisfaction_rating)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
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
  abierta: "border-[1.5px] border-dashed border-foreground text-foreground",
  atendida: "bg-brand-yellow text-ink",
  cerrada: "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
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
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-6 text-foreground">Quejas</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <a
            key={filter.value}
            href={filter.value === "all" ? "/admin/quejas" : `/admin/quejas?status=${filter.value}`}
            className={`rounded-full px-4 py-1.5 text-[15px] font-medium transition ${
              activeFilter === filter.value
                ? "bg-brand-yellow hover:bg-[#e8b90f] text-ink"
                : "border-[1.5px] border-field-border text-muted hover:border-foreground"
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      {!complaints || complaints.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-16 text-center">
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
                className="block rounded-2xl bg-surface p-5 sm:p-6 transition hover:border-brand-yellow-dark dark:hover:border-brand-yellow dark:ring-1 dark:ring-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{client?.full_name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                      <Calendar size={11} />
                      {new Date(c.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}Folio {c.order_id.slice(0, 8).toUpperCase()}
                      {" · "}
                      {c.source === "web" ? "En línea" : "WhatsApp"}
                    </p>
                    <p className="mt-1.5 truncate text-[15px] text-muted">{c.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                    {c.satisfaction_rating ? (
                      <span className="text-[13px] text-yellow-text">
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
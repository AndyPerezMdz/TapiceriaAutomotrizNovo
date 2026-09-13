import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  abierta: "Abierta",
  atendida: "Atendida",
  cerrada: "Cerrada",
};

const statusColors: Record<string, string> = {
  abierta: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  atendida: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  cerrada: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export default async function MisQuejasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: complaints } = user
    ? await supabase
        .from("complaints")
        .select(
          "id, description, status, source, created_at, satisfaction_rating, order_id, orders(vehicle_make, vehicle_model)",
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Mis quejas</h1>
      <p className="mb-6 text-sm text-muted">
        Aquí puedes ver el estado de cualquier problema que hayas reportado, ya sea desde la
        página o por WhatsApp.
      </p>

      {!complaints || complaints.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
          <AlertTriangle size={24} className="mb-2 text-muted" />
          <p className="text-sm text-muted">No tienes ninguna queja registrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const order = c.orders as unknown as {
              vehicle_make: string | null;
              vehicle_model: string | null;
            } | null;
            const vehicle = [order?.vehicle_make, order?.vehicle_model].filter(Boolean).join(" ");

            return (
              <Link
                key={c.id}
                href={`/portal/quejas/${c.id}`}
                className="block rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {vehicle || "Pedido"} · Folio {c.order_id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <Calendar size={11} />
                      {new Date(c.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {c.source === "web" ? "Reportada en línea" : "Reportada por WhatsApp"}
                    </p>
                    <p className="mt-1.5 truncate text-sm text-muted">{c.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[c.status]}`}
                    >
                      {statusLabels[c.status]}
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
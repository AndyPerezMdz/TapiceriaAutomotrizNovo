import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  abierta: "Abierta",
  atendida: "Atendida",
  cerrada: "Cerrada",
};

const statusColors: Record<string, string> = {
  abierta: "bg-brand-red-dark text-white",
  atendida: "bg-brand-yellow text-ink",
  cerrada: "border-[1.5px] border-muted text-muted",
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
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-2 text-foreground">Mis quejas</h1>
      <p className="mb-6 text-[15px] text-muted">
        Aquí puedes ver el estado de cualquier problema que hayas reportado, ya sea desde la
        página o por WhatsApp.
      </p>

      {!complaints || complaints.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-field-border bg-surface p-10 text-center">
          <AlertTriangle size={24} className="mb-2 text-muted" />
          <p className="text-[15px] text-muted">No tienes ninguna queja registrada.</p>
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
                className="block rounded-2xl bg-surface p-5 sm:p-6 transition hover:border-brand-yellow-dark dark:hover:border-brand-yellow dark:ring-1 dark:ring-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-foreground">
                      {vehicle || "Pedido"} · Folio {c.order_id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                      <Calendar size={11} />
                      {new Date(c.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {c.source === "web" ? "Reportada en línea" : "Reportada por WhatsApp"}
                    </p>
                    <p className="mt-1.5 truncate text-[15px] text-muted">{c.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-xl px-2.5 py-1 font-display text-[15px] font-bold uppercase leading-none tracking-[0.08em] ${statusColors[c.status]}`}
                    >
                      {statusLabels[c.status]}
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
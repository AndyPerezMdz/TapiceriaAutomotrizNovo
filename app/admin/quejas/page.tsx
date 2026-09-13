import { ComplaintStatusButton } from "@/components/admin/ComplaintStatusButton";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

export default async function AdminQuejasPage() {
  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from("complaints")
    .select(
      "id, description, status, resolution_note, source, created_at, order_id, profiles!complaints_client_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Quejas</h1>

      {!complaints || complaints.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <AlertTriangle size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-muted">No hay quejas registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const client = c.profiles as unknown as { full_name: string } | null;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{client?.full_name}</p>
                    <Link
                      href={`/admin/pedidos/${c.order_id}`}
                      className="text-xs text-brand-yellow-dark hover:underline dark:text-brand-yellow"
                    >
                      Folio {c.order_id.slice(0, 8).toUpperCase()}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Calendar size={11} />
                      {new Date(c.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {c.source === "web" ? "En línea" : "WhatsApp"}
                    </p>
                  </div>
                  <ComplaintStatusButton id={c.id} status={c.status} />
                </div>
                <p className="mt-2 break-words text-sm text-foreground">{c.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
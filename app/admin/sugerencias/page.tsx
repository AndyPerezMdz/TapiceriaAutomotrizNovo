import { SiteFeedbackStatusButton } from "@/components/admin/SiteFeedbackStatusButton";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Lightbulb } from "lucide-react";

const typeLabels: Record<string, string> = {
  sugerencia: "Sugerencia",
  queja: "Queja",
};

const typeColors: Record<string, string> = {
  sugerencia: "bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow",
  queja: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default async function AdminSugerenciasPage() {
  const supabase = await createClient();

  const { data: feedback } = await supabase
    .from("site_feedback")
    .select("id, client_id, type, message, status, created_at")
    .order("created_at", { ascending: false });

  const clientIds = [...new Set((feedback ?? []).map((f) => f.client_id))];
  const { data: profiles } = clientIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", clientIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Sugerencias de la página
      </h1>
      <p className="mb-6 text-sm text-muted">
        Comentarios de los clientes sobre la página web (no sobre pedidos).
      </p>

      {!feedback || feedback.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <Lightbulb size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-muted">Aún no hay sugerencias ni quejas sobre la página.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {names.get(f.client_id) ?? "Cliente"}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[f.type]}`}
                    >
                      {typeLabels[f.type] ?? f.type}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <Calendar size={11} />
                    {new Date(f.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-foreground">{f.message}</p>
                </div>
                <SiteFeedbackStatusButton id={f.id} status={f.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

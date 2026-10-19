import { SiteFeedbackStatusButton } from "@/components/admin/SiteFeedbackStatusButton";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Lightbulb } from "lucide-react";

const typeLabels: Record<string, string> = {
  sugerencia: "Sugerencia",
  queja: "Queja",
};

const typeColors: Record<string, string> = {
  sugerencia: "bg-highlight text-yellow-text",
  queja: "border-[1.5px] border-brand-red-dark text-brand-red-dark dark:border-brand-red dark:text-brand-red",
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
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-2 text-foreground">
        Sugerencias de la página
      </h1>
      <p className="mb-6 text-[15px] text-muted">
        Comentarios de los clientes sobre la página web (no sobre pedidos).
      </p>

      {!feedback || feedback.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-16 text-center">
          <Lightbulb size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-muted">Aún no hay sugerencias ni quejas sobre la página.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <div
              key={f.id}
              className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {names.get(f.client_id) ?? "Cliente"}
                    </p>
                    <span
                      className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${typeColors[f.type]}`}
                    >
                      {typeLabels[f.type] ?? f.type}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                    <Calendar size={11} />
                    {new Date(f.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-[15px] text-foreground">{f.message}</p>
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

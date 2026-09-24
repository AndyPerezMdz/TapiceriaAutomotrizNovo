import { SiteFeedbackForm } from "@/components/portal/SiteFeedbackForm";
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

const statusLabels: Record<string, string> = {
  nuevo: "Enviado",
  revisado: "Revisado",
};

const statusColors: Record<string, string> = {
  nuevo: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  revisado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export default async function SugerenciasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: feedback } = user
    ? await supabase
        .from("site_feedback")
        .select("id, type, message, status, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Sugerencias y quejas
      </h1>
      <p className="mb-6 text-sm text-muted">
        ¿Algo de la página web te pareció confuso o se te ocurre cómo mejorarla? Cuéntanos. Si tu
        comentario es sobre un pedido específico, repórtalo desde el detalle de ese pedido.
      </p>

      <SiteFeedbackForm />

      <h2 className="mb-3 mt-8 text-sm font-semibold text-foreground">Lo que nos has enviado</h2>

      {!feedback || feedback.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
          <Lightbulb size={24} className="mb-2 text-muted" />
          <p className="text-sm text-muted">Aún no nos has enviado comentarios sobre la página.</p>
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
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[f.type]}`}
                    >
                      {typeLabels[f.type] ?? f.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <Calendar size={11} />
                      {new Date(f.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-foreground">{f.message}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[f.status]}`}
                >
                  {statusLabels[f.status] ?? f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

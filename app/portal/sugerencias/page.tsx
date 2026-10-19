import { SiteFeedbackForm } from "@/components/portal/SiteFeedbackForm";
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

const statusLabels: Record<string, string> = {
  nuevo: "Enviado",
  revisado: "Revisado",
};

const statusColors: Record<string, string> = {
  nuevo: "border-[1.5px] border-dashed border-foreground text-foreground",
  revisado: "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
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
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-2 text-foreground">
        Sugerencias y quejas
      </h1>
      <p className="mb-6 text-[15px] text-muted">
        ¿Algo de la página web te pareció confuso o se te ocurre cómo mejorarla? Cuéntanos. Si tu
        comentario es sobre un pedido específico, repórtalo desde el detalle de ese pedido.
      </p>

      <SiteFeedbackForm />

      <h2 className="font-display text-2xl font-bold uppercase mb-3 mt-8 text-foreground">Lo que nos has enviado</h2>

      {!feedback || feedback.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-field-border bg-surface p-10 text-center">
          <Lightbulb size={24} className="mb-2 text-muted" />
          <p className="text-[15px] text-muted">Aún no nos has enviado comentarios sobre la página.</p>
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
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-xl px-2.5 py-1 font-display text-[15px] font-bold uppercase leading-none tracking-[0.08em] ${typeColors[f.type]}`}
                    >
                      {typeLabels[f.type] ?? f.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] text-muted">
                      <Calendar size={11} />
                      {new Date(f.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[15px] text-foreground">{f.message}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center whitespace-nowrap rounded-xl px-2.5 py-1 font-display text-[15px] font-bold uppercase leading-none tracking-[0.08em] ${statusColors[f.status]}`}
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

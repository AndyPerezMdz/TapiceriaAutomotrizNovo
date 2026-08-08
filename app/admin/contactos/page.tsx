import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Phone } from "lucide-react";

export default async function AdminContactosPage() {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("contact_submissions")
    .select("id, name, phone, message, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Mensajes de contacto
      </h1>

      {!submissions || submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No hay mensajes todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted">
                  {new Date(s.created_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <Phone size={14} /> {s.phone}
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground">
                <MessageSquare size={14} className="mt-0.5 shrink-0" />
                {s.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { AppointmentStatusButton } from "@/components/admin/AppointmentStatusButton";
import { createClient } from "@/lib/supabase/server";
import { Calendar, MessageSquare, Phone } from "lucide-react";

export default async function AdminCitasPage() {
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, client_name, client_phone, appointment_date, appointment_time, status, reason",
    )
    .neq("status", "cancelada")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Citas agendadas
      </h1>

      {!appointments || appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No hay citas próximas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{a.client_name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <Calendar size={12} />
                    {new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString(
                      "es-MX",
                      { weekday: "long", day: "numeric", month: "long" },
                    )}{" "}
                    · {a.appointment_time}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <Phone size={12} /> {a.client_phone}
                  </p>
                </div>
                <AppointmentStatusButton id={a.id} status={a.status} />
              </div>

              {a.reason ? (
                <div className="mt-3 flex items-start gap-1.5 rounded-md bg-black/5 p-2.5 dark:bg-white/5">
                  <MessageSquare size={13} className="mt-0.5 shrink-0 text-muted" />
                  <p className="break-words text-xs text-foreground">{a.reason}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
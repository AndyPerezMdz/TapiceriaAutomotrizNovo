import { AppointmentActions } from "@/components/admin/AppointmentActions";
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
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-6 text-foreground">
        Citas agendadas
      </h1>

      {!appointments || appointments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-16 text-center">
          <p className="text-muted">No hay citas próximas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{a.client_name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                    <Calendar size={12} />
                    {new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString(
                      "es-MX",
                      { weekday: "long", day: "numeric", month: "long" },
                    )}{" "}
                    · {a.appointment_time}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                    <Phone size={12} /> {a.client_phone}
                  </p>
                </div>
                <AppointmentActions
                  id={a.id}
                  status={a.status}
                  appointmentDate={a.appointment_date}
                  appointmentTime={a.appointment_time}
                />
              </div>

              {a.reason ? (
                <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-black/5 p-2.5 dark:bg-white/5">
                  <MessageSquare size={13} className="mt-0.5 shrink-0 text-muted" />
                  <p className="break-words text-[13px] text-foreground">{a.reason}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { MyAppointmentsList } from "@/components/portal/MyAppointmentsList";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays } from "lucide-react";

export default async function MisCitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: appointments } = user
    ? await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status")
        .eq("client_id", user.id)
        .order("appointment_date", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Mis citas
      </h1>
      <p className="mb-8 text-sm text-muted">
        Consulta el estado de tus visitas agendadas al taller.
      </p>

      {!appointments || appointments.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
          <CalendarDays size={28} className="mb-2 text-muted" />
          <p className="text-sm text-muted">
            No tienes citas agendadas todavía. Cuando elijas un color de piel
            que requiera visita, podrás agendar una desde ahí.
          </p>
        </div>
      ) : (
        <MyAppointmentsList appointments={appointments} />
      )}
    </div>
  );
}
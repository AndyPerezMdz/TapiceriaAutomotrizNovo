import { MyAppointmentsList } from "@/components/portal/MyAppointmentsList";
import { EmptyState } from "@/components/shared/EmptyState";
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
        <EmptyState
          icon={CalendarDays}
          title="Sin citas agendadas"
          description="Cuando elijas un color de piel que requiera visita, vas a poder agendar tu cita desde ahí."
        />
      ) : (
        <MyAppointmentsList appointments={appointments} />
      )}
    </div>
  );
}
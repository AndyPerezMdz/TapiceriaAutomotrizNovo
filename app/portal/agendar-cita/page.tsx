import { AppointmentBooking } from "@/components/portal/AppointmentBooking";
import { createClient } from "@/lib/supabase/server";

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function AgendarCitaPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()
    : { data: null };

  const startWindow = new Date();
  const endWindow = new Date();
  endWindow.setDate(endWindow.getDate() + 25);

  const [{ data: blocked }, { data: existing }] = await Promise.all([
    supabase
      .from("blocked_dates")
      .select("blocked_date")
      .gte("blocked_date", startWindow.toISOString().slice(0, 10))
      .lte("blocked_date", endWindow.toISOString().slice(0, 10)),
    supabase
      .from("appointments")
      .select("appointment_date, appointment_time")
      .neq("status", "cancelada")
      .gte("appointment_date", startWindow.toISOString().slice(0, 10))
      .lte("appointment_date", endWindow.toISOString().slice(0, 10)),
  ]);

  const takenSlots: Record<string, string[]> = {};
  existing?.forEach((a) => {
    if (!takenSlots[a.appointment_date]) takenSlots[a.appointment_date] = [];
    takenSlots[a.appointment_date].push(a.appointment_time);
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Agendar visita
      </h1>
      <p className="mb-8 text-sm text-muted">
        Para colores de piel personalizados, necesitamos ver tu vehículo en
        persona y tomar una muestra del asiento.
      </p>

      <AppointmentBooking
        clientName={profile?.full_name ?? ""}
        clientPhone={profile?.phone ?? ""}
        orderId={order ?? null}
        blockedDates={blocked?.map((b) => b.blocked_date) ?? []}
        takenSlots={takenSlots}
      />
    </div>
  );
}
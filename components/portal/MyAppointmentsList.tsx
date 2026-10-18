import { Calendar, Clock } from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente de confirmar",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

const statusColors: Record<string, string> = {
  pendiente: "border-[1.5px] border-dashed border-foreground text-foreground",
  confirmada: "bg-brand-yellow text-ink",
  completada: "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40",
  cancelada: "border-[1.5px] border-muted text-muted line-through",
};

export function MyAppointmentsList({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl font-bold uppercase mb-3 text-foreground">Tus citas</h2>
      <div className="space-y-2">
        {appointments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-2xl bg-surface p-3 dark:ring-1 dark:ring-white/5"
          >
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-muted" />
              <div>
                <p className="text-[15px] font-medium capitalize text-foreground">
                  {new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString(
                    "es-MX",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}
                </p>
                <p className="flex items-center gap-1 text-[13px] text-muted">
                  <Clock size={11} /> {a.appointment_time}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center whitespace-nowrap rounded-xl px-2.5 py-1 font-display text-[15px] font-bold uppercase leading-none tracking-[0.08em] ${
                statusColors[a.status] ?? "border-[1.5px] border-muted text-muted"
              }`}
            >
              {statusLabels[a.status] ?? a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
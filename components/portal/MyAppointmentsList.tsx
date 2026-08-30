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
  pendiente: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  confirmada: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  completada: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  cancelada: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function MyAppointmentsList({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Tus citas</h2>
      <div className="space-y-2">
        {appointments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-lg border border-black/10 bg-surface p-3 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-muted" />
              <div>
                <p className="text-sm font-medium capitalize text-foreground">
                  {new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString(
                    "es-MX",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Clock size={11} /> {a.appointment_time}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                statusColors[a.status] ?? "bg-gray-100 text-gray-600"
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
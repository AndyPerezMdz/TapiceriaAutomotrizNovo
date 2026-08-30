import { statusColors, statusLabels } from "@/lib/constants/order-status";
import { Check } from "lucide-react";

interface HistoryEntry {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
  changed_by: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface Props {
  history: HistoryEntry[];
  profiles: Profile[];
  currentUserId: string | null;
}

export function OrderTimeline({ history, profiles, currentUserId }: Props) {
  function getActorLabel(changedBy: string | null): string {
    if (!changedBy) return "Sistema";
    if (changedBy === currentUserId) return "Tú";
    const profile = profiles.find((p) => p.id === changedBy);
    if (!profile) return "Sistema";
    return profile.role === "cliente" ? profile.full_name : `${profile.full_name} (staff)`;
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                statusColors[entry.status]?.split(" ")[0] ?? "bg-gray-100"
              }`}
            >
              <Check size={12} className="text-brand-black" />
            </div>
            {index < history.length - 1 ? (
              <div className="mt-1 w-px flex-1 bg-black/10 dark:bg-white/10" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pb-4">
            <p className="text-sm font-medium text-foreground">
              {statusLabels[entry.status] ?? entry.status}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {new Date(entry.created_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                timeZone: "America/Merida",
              })}{" "}
              · {getActorLabel(entry.changed_by)}
            </p>
            {entry.note ? (
              <p className="mt-1 break-words text-xs text-muted">{entry.note}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
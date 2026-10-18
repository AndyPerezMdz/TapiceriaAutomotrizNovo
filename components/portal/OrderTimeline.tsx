import { statusLabels } from "@/lib/constants/order-status";

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
    <ol>
      {history.map((entry, index) => (
        <li key={entry.id} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <div
              className={`mt-[5px] h-3 w-3 shrink-0 rounded-full ${
                index === history.length - 1 ? "bg-brand-yellow" : "bg-ink dark:bg-on-ink-muted"
              }`}
            />
            {index < history.length - 1 ? (
              <div className="mt-1 flex-1 border-l-2 border-dashed border-seam" />
            ) : null}
          </div>

          <div className={`min-w-0 flex-1 ${index < history.length - 1 ? "pb-5" : ""}`}>
            <p className="text-base font-semibold text-foreground">
              {statusLabels[entry.status] ?? entry.status}
            </p>
            <p className="mt-0.5 text-[15px] text-muted">
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
              <p className="mt-1 break-words text-[15px] text-foreground/80">{entry.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
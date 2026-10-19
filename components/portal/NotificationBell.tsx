"use client";

import type { NotificationItem } from "@/lib/notifications/get-portal-notifications";
import { createClient } from "@/lib/supabase/client";
import { Bell, BellRing, CheckCheck, FileText, RefreshCw, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const icons = {
  cotizacion: FileText,
  recordatorio: BellRing,
  actualizacion: RefreshCw,
  resena: Star,
};

function relative(value: string) {
  const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(value).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function exact(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Merida",
  });
}

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [readKeys, setReadKeys] = useState<Set<string>>(
    () => new Set(notifications.filter((n) => n.read).map((n) => n.key)),
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadKeys(new Set(notifications.filter((n) => n.read).map((n) => n.key)));
  }, [notifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const unread = notifications.filter((n) => !readKeys.has(n.key));
  const visible = filter === "unread" ? unread : notifications;

  async function markRead(keys: string[]) {
    const pending = keys.filter((k) => !readKeys.has(k));
    if (pending.length === 0) return;
    setReadKeys((prev) => new Set([...prev, ...pending]));
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notification_reads")
      .upsert(
        pending.map((notification_key) => ({ user_id: user.id, notification_key })),
        { onConflict: "user_id,notification_key", ignoreDuplicates: true },
      );
  }

  async function openItem(n: NotificationItem) {
    setOpen(false);
    markRead([n.key]);
    router.push(n.href);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread.length > 0 ? `Notificaciones, ${unread.length} sin leer` : "Notificaciones"}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
      >
        <Bell size={20} />
        {unread.length > 0 ? (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white ring-2 ring-background">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="fixed inset-x-3 top-16 z-50 origin-top animate-panel-in overflow-hidden rounded-[18px] bg-surface shadow-2xl ring-1 ring-black/10 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] dark:ring-white/10"
        >
          <div className="flex items-center justify-between gap-3 bg-ink px-4 py-3.5 text-on-ink">
            <p className="font-display text-xl font-bold uppercase leading-none">
              Notificaciones
              {unread.length > 0 ? (
                <span className="ml-2 rounded-full bg-brand-yellow px-2 py-0.5 align-middle font-taller text-xs font-bold text-ink">
                  {unread.length} nuevas
                </span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar notificaciones"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-on-ink-muted hover:bg-white/10 hover:text-on-ink"
            >
              <X size={18} />
            </button>
          </div>

          {notifications.length > 0 ? (
            <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-seam px-3 py-2">
              <div role="group" aria-label="Filtrar" className="flex gap-1">
                {(["all", "unread"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={filter === f}
                    onClick={() => setFilter(f)}
                    className={`min-h-9 rounded-full px-3 text-sm transition ${
                      filter === f ? "bg-ink font-semibold text-brand-yellow" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "Todas" : `Sin leer${unread.length ? ` · ${unread.length}` : ""}`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => markRead(unread.map((n) => n.key))}
                disabled={unread.length === 0}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-foreground transition hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
              >
                <CheckCheck size={16} /> Marcar todo como leído
              </button>
            </div>
          ) : null}

          {visible.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Bell size={26} className="mx-auto text-muted" aria-hidden="true" />
              <p className="mt-3 text-[15px] text-muted">
                {filter === "unread" ? "Ya leíste todo. ¡Bien!" : "Estás al día, no tienes nada pendiente."}
              </p>
            </div>
          ) : (
            <ul className="max-h-[65vh] overflow-y-auto sm:max-h-[420px]">
              {visible.map((n) => {
                const Icon = icons[n.type];
                const isUnread = !readKeys.has(n.key);
                const urgent = n.type === "cotizacion" || n.type === "recordatorio";
                return (
                  <li key={n.key} className="border-b border-seam last:border-0">
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${
                        isUnread ? "bg-highlight/60" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          urgent ? "bg-brand-yellow text-ink" : "bg-ink text-brand-yellow dark:ring-1 dark:ring-white/10"
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[15px] leading-snug text-foreground ${isUnread ? "font-semibold" : ""}`}>
                          {n.title}
                        </span>
                        <span className="block truncate text-sm text-muted">{n.description}</span>
                        <time dateTime={n.date} title={exact(n.date)} className="mt-1 block text-[13px] text-muted">
                          {relative(n.date)} · {exact(n.date)}
                        </time>
                      </span>
                      {isUnread ? (
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-red" aria-label="Sin leer" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

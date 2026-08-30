"use client";

import type { NotificationItem } from "@/lib/notifications/get-portal-notifications";
import { AlertCircle, Bell, RefreshCw, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const icons = {
  cotizacion: AlertCircle,
  actualizacion: RefreshCw,
  resena: Star,
};

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
      >
        <Bell size={18} />
        {notifications.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
            {notifications.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-black/10 bg-surface shadow-xl dark:border-white/10">
          <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
            <p className="text-sm font-semibold text-foreground">Notificaciones</p>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Estás al día, no tienes nada pendiente.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = icons[n.type];
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 border-b border-black/5 px-4 py-3 transition last:border-0 hover:bg-black/5 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <Icon
                      size={16}
                      className="mt-0.5 shrink-0 text-brand-yellow-dark dark:text-brand-yellow"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="truncate text-xs text-muted">{n.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
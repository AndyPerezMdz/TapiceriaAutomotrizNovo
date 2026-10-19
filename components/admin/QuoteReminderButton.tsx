"use client";

import { useToast } from "@/components/shared/ToastProvider";
import { BellRing, Mail } from "lucide-react";
import { useState } from "react";

interface Props {
  orderId: string;
  /** Cuándo se mandó el último recordatorio (si hubo). */
  lastReminderAt?: string | null;
  size?: "md" | "sm";
}

function agoLabel(value: string) {
  const hours = Math.floor((Date.now() - new Date(value).getTime()) / 36e5);
  if (hours < 1) return "hace un momento";
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}

/** Staff → cliente: recordatorio de cotización sin responder (push y/o correo). */
export function QuoteReminderButton({ orderId, lastReminderAt = null, size = "md" }: Props) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(lastReminderAt);

  async function send(channels: ("push" | "email")[]) {
    setBusy(true);
    setOpen(false);
    try {
      const res = await fetch("/api/notify/quote-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, channels }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error ?? "No se pudo mandar el recordatorio.", "error");
      } else {
        const sent: string[] = data.sent ?? [];
        const label = sent.map((c) => (c === "push" ? "notificación" : "correo")).join(" y ");
        showToast(`Recordatorio enviado por ${label}.`, "success");
        setLast(new Date().toISOString());
      }
    } catch {
      showToast("No se pudo mandar el recordatorio.", "error");
    }
    setBusy(false);
  }

  const height = size === "sm" ? "min-h-11" : "min-h-12";

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <div className="inline-flex overflow-hidden rounded-xl border-[1.5px] border-foreground">
        <button
          type="button"
          onClick={() => send(["push", "email"])}
          disabled={busy}
          className={`inline-flex ${height} items-center gap-2 px-4 text-[15px] font-semibold text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5`}
        >
          <BellRing size={17} />
          {busy ? "Enviando…" : "Recordar al cliente"}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          aria-label="Elegir cómo recordar"
          aria-expanded={open}
          className={`inline-flex ${height} w-11 items-center justify-center border-l-[1.5px] border-foreground text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-60 animate-panel-in overflow-hidden rounded-xl bg-surface p-1.5 shadow-xl ring-1 ring-black/10 dark:ring-white/10">
          <button
            type="button"
            onClick={() => send(["push"])}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[15px] text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          >
            <BellRing size={16} /> Solo notificación
          </button>
          <button
            type="button"
            onClick={() => send(["email"])}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[15px] text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Mail size={16} /> Solo correo
          </button>
        </div>
      ) : null}

      {last ? <p className="text-[13px] text-muted">Último recordatorio {agoLabel(last)}</p> : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface Props {
  hoursWeekday: string;
  hoursSaturday: string;
  /** "ink" sobre el panel negro; "light" sobre fondo claro (celular). */
  tone?: "ink" | "light";
}

type Day = "weekday" | "saturday" | "sunday";

/** Convierte "9:30 am – 5:00 pm" en minutos desde medianoche. */
function parseRange(text: string): [number, number] | null {
  const matches = [...text.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/gi)];
  if (matches.length < 2) return null;
  const toMinutes = (m: RegExpMatchArray) => {
    let h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === "p") h += 12;
    return h * 60 + Number(m[2] ?? 0);
  };
  return [toMinutes(matches[0]), toMinutes(matches[1])];
}

function formatMinutes(total: number) {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Hora actual en Mérida. */
function nowInMerida() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Merida",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const day: Day = weekday === "Sun" ? "sunday" : weekday === "Sat" ? "saturday" : "weekday";
  return { day, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

export function ShopHours({ hoursWeekday, hoursSaturday, tone = "ink" }: Props) {
  const [now, setNow] = useState<{ day: Day; minutes: number } | null>(null);

  useEffect(() => {
    setNow(nowInMerida());
    const id = setInterval(() => setNow(nowInMerida()), 60_000);
    return () => clearInterval(id);
  }, []);

  const ranges: Record<Day, [number, number] | null> = {
    weekday: parseRange(hoursWeekday),
    saturday: parseRange(hoursSaturday),
    sunday: null,
  };

  let status: { open: boolean; text: string } | null = null;
  if (now) {
    const range = ranges[now.day];
    if (range && now.minutes >= range[0] && now.minutes < range[1]) {
      status = { open: true, text: `Abierto ahora · cierra ${formatMinutes(range[1])}` };
    } else if (range && now.minutes < range[0]) {
      status = { open: false, text: `Cerrado · abre hoy ${formatMinutes(range[0])}` };
    } else {
      status = { open: false, text: "Cerrado ahora" };
    }
  }

  const ink = tone === "ink";
  const rows: { day: Day; label: string; value: string }[] = [
    { day: "weekday", label: "Lunes a viernes", value: hoursWeekday },
    { day: "saturday", label: "Sábado", value: hoursSaturday },
    { day: "sunday", label: "Domingo", value: "Cerrado" },
  ];

  return (
    <section
      aria-label="Horario del taller"
      className={
        ink
          ? "border-t-2 border-dashed border-brand-yellow/50 pt-5"
          : "rounded-2xl border-2 border-dashed border-field-border p-5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={`font-display text-[22px] font-bold uppercase leading-none tracking-[0.04em] ${
            ink ? "text-on-ink" : "text-foreground"
          }`}
        >
          Horario del taller
        </p>
        {status ? (
          <p
            className={`inline-flex items-center gap-2 text-sm font-semibold ${
              status.open
                ? ink
                  ? "text-brand-yellow"
                  : "text-yellow-text"
                : ink
                  ? "text-on-ink-muted"
                  : "text-muted"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                status.open
                  ? "bg-brand-yellow shadow-[0_0_0_4px_rgba(245,197,24,0.22)]"
                  : ink
                    ? "bg-[#5c5a55]"
                    : "bg-muted/60"
              }`}
            />
            {status.text}
          </p>
        ) : null}
      </div>

      <dl className="mt-3.5 space-y-2 text-base">
        {rows.map((row) => {
          const today = now?.day === row.day;
          return (
            <div key={row.day} className="flex justify-between gap-3">
              <dt
                className={
                  today
                    ? `font-semibold ${ink ? "text-on-ink" : "text-foreground"}`
                    : ink
                      ? "text-[#d9d5cc]"
                      : "text-muted"
                }
              >
                {row.label}
                {today ? <span className="sr-only"> (hoy)</span> : null}
              </dt>
              <dd
                className={`m-0 ${
                  today
                    ? `font-bold ${ink ? "text-brand-yellow" : "text-foreground"}`
                    : row.day === "sunday"
                      ? ink
                        ? "text-on-ink-muted"
                        : "text-muted"
                      : `font-semibold ${ink ? "text-on-ink" : "text-foreground"}`
                }`}
              >
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className={`mt-3.5 text-sm leading-relaxed ${ink ? "text-on-ink-muted" : "text-muted"}`}>
        Puedes pedir tu cotización a cualquier hora; te respondemos en horario del taller.
      </p>
    </section>
  );
}

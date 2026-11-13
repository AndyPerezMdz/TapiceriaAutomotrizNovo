"use client";

import { DateSlotPicker, formatDropoff } from "@/components/shared/DateSlotPicker";
import { buttonClass } from "@/components/taller";
import type { CalendarAvailability } from "@/lib/data/calendar";
import { createClient } from "@/lib/supabase/client";
import { CalendarCheck, CalendarClock, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface DropoffProposal {
  id: string;
  proposed_by: "staff" | "cliente";
  proposed_date: string;
  proposed_time: string;
  status: "pendiente" | "aceptada" | "rechazada";
  created_at: string;
}

interface Props {
  side: "staff" | "cliente";
  orderId: string;
  proposals: DropoffProposal[];
  availability: CalendarAvailability;
  /** WhatsApp con mensaje base y link al pedido, para cuando se acaban las sugerencias. */
  whatsappHref: string | null;
}

/** La original + 3 sugerencias. Debe coincidir con propose_dropoff en la base de datos. */
const MAX_PROPOSALS = 4;

/**
 * Fecha para traer el coche al taller: el staff propone, el cliente acepta o
 * sugiere otra, y así hasta 3 sugerencias; después, WhatsApp.
 */
export function DropoffScheduler({ side, orderId, proposals, availability, whatsappHref }: Props) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...proposals].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const confirmed = sorted.find((p) => p.status === "aceptada");
  const pending = sorted.find((p) => p.status === "pendiente");
  const suggestionsUsed = Math.max(0, sorted.length - 1);
  const limitReached = sorted.length >= MAX_PROPOSALS;
  const theirTurn = pending && pending.proposed_by !== side; // me toca responder
  const isStaff = side === "staff";

  async function notify() {
    await fetch("/api/notify/dropoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});
  }

  async function propose() {
    if (!date || !slot) return;
    setBusy(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc("propose_dropoff", {
      p_order_id: orderId,
      p_date: date,
      p_time: slot,
    });
    if (rpcError) {
      setError(rpcError.message);
      setBusy(false);
      return;
    }
    await notify();
    setPicking(false);
    setDate(null);
    setSlot(null);
    setBusy(false);
    router.refresh();
  }

  async function accept(id: string) {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc("accept_dropoff", { p_proposal_id: id });
    if (rpcError) {
      setError(rpcError.message);
      setBusy(false);
      return;
    }
    await notify();
    setBusy(false);
    router.refresh();
  }

  // Al cliente no le mostramos nada hasta que el taller proponga.
  if (!isStaff && sorted.length === 0) return null;

  const whoLabel = (p: DropoffProposal) =>
    p.proposed_by === "staff" ? (isStaff ? "El taller propuso" : "Te propusimos") : isStaff ? "El cliente sugirió" : "Sugeriste";

  return (
    <section className="rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-brand-yellow">
          {confirmed ? <CalendarCheck size={20} /> : <CalendarClock size={20} />}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[1.75rem] font-bold uppercase leading-none text-foreground">
            {isStaff ? "Fecha para recibir el coche" : "¿Cuándo traes tu coche?"}
          </h2>
          {!confirmed && sorted.length > 0 ? (
            <p className="mt-1 text-[0.8125rem] text-muted">
              Sugerencias: {suggestionsUsed} de {MAX_PROPOSALS - 1}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {confirmed ? (
          <div className="rounded-xl bg-brand-yellow p-4 text-ink">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em]">Confirmado</p>
            <p className="mt-1 font-display text-[1.75rem] font-extrabold uppercase leading-tight">
              {formatDropoff(confirmed.proposed_date, confirmed.proposed_time)}
            </p>
            <p className="mt-1 text-[0.9375rem]">
              {isStaff ? "Ya está en el calendario de citas." : "Te esperamos en el taller. Si se te complica, escríbenos por WhatsApp."}
            </p>
          </div>
        ) : null}

        {!confirmed && pending ? (
          <div className="rounded-xl border-2 border-dashed border-brand-yellow-dark/60 bg-highlight p-4 dark:border-brand-yellow/50">
            <p className="text-[0.9375rem] text-foreground">{whoLabel(pending)}:</p>
            <p className="mt-1 font-display text-[1.75rem] font-extrabold uppercase leading-tight text-foreground">
              {formatDropoff(pending.proposed_date, pending.proposed_time)}
            </p>
            {theirTurn ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => accept(pending.id)} className={buttonClass("primary")}>
                  {isStaff ? "Aceptar esta fecha" : "Me queda, confirmar"}
                </button>
                {!limitReached ? (
                  <button type="button" disabled={busy} onClick={() => setPicking(true)} className={buttonClass("outline")}>
                    Sugerir otra fecha
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[0.9375rem] text-muted">
                {isStaff ? "Esperando respuesta del cliente." : "Esperando que el taller la confirme."}
              </p>
            )}
          </div>
        ) : null}

        {!confirmed && !pending && isStaff ? (
          <p className="text-[0.9375rem] text-muted">
            Propón al cliente el día y la hora para traer el coche. Le llega aviso y puede aceptar o sugerir otra.
          </p>
        ) : null}

        {/* Proponer: el staff al inicio o cuando le toca; cualquiera al pedir otra fecha */}
        {!confirmed && !limitReached && (picking || (isStaff && !pending)) ? (
          <div className="space-y-4 rounded-xl border-[1.5px] border-field-border p-4">
            <DateSlotPicker
              {...availability}
              date={date}
              slot={slot}
              onChange={(d, s) => {
                setDate(d);
                setSlot(s);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy || !date || !slot} onClick={propose} className={buttonClass("ink")}>
                {busy ? "Enviando…" : isStaff ? "Proponer esta fecha" : "Sugerir esta fecha"}
              </button>
              {picking ? (
                <button type="button" onClick={() => setPicking(false)} className={buttonClass("ghost")}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!confirmed && limitReached ? (
          <div className="rounded-xl bg-ink p-4 text-on-ink">
            <p className="text-[0.9375rem]">
              Ya se hicieron las 3 sugerencias. Para no darle más vueltas, acuérdenlo por WhatsApp
              {theirTurn ? " (o acepta la última propuesta)" : ""}.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 font-semibold text-white"
              >
                <MessageCircle size={18} /> Acordar por WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="text-[0.9375rem] text-brand-red-dark dark:text-brand-red">{error}</p> : null}

        {sorted.length > 1 ? (
          <details className="text-[0.9375rem]">
            <summary className="cursor-pointer text-muted">Historial de propuestas</summary>
            <ol className="mt-2 space-y-1 border-l-2 border-dashed border-seam pl-4">
              {sorted.map((p) => (
                <li key={p.id} className={p.status === "rechazada" ? "text-muted line-through" : "text-foreground"}>
                  {whoLabel(p)} {formatDropoff(p.proposed_date, p.proposed_time)}
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    </section>
  );
}

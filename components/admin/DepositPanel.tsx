"use client";

import { buttonClass, fieldClass } from "@/components/taller";
import { createClient } from "@/lib/supabase/client";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  orderId: string;
  /** Total ya con descuento. */
  total: number;
  depositAmount: number | null;
  depositPaidAt: string | null;
  couponRequiresDeposit: boolean;
  locked: boolean;
}

const money = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

/** El staff registra el anticipo que dejó el cliente (efectivo o transferencia). */
export function DepositPanel({ orderId, total, depositAmount, depositPaidAt, couponRequiresDeposit, locked }: Props) {
  const router = useRouter();
  const suggested = Math.ceil(total * 0.5);
  const [amount, setAmount] = useState(depositAmount ? String(depositAmount) : String(suggested));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(value: number | null) {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc("register_deposit", {
      p_order_id: orderId,
      p_amount: value,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.refresh();
  }

  const paid = depositAmount ?? 0;
  const pending = Math.max(total - paid, 0);
  const meetsHalf = paid >= total * 0.5;

  return (
    <section className="rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-brand-yellow">
          <Wallet size={20} />
        </span>
        <div>
          <h2 className="font-display text-[1.75rem] font-bold uppercase leading-none text-foreground">Anticipo</h2>
          <p className="mt-1 text-[0.9375rem] text-muted">
            Total {money(total)} · el 50% es {money(suggested)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-highlight p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Recibido</p>
          <p className="mt-1 font-display text-[1.75rem] font-extrabold leading-none text-foreground">{money(paid)}</p>
          {depositPaidAt ? (
            <p className="mt-1 text-[0.8125rem] text-muted">
              {new Date(depositPaidAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Merida" })}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border-2 border-dashed border-seam p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Falta al entregar</p>
          <p className="mt-1 font-display text-[1.75rem] font-extrabold leading-none text-foreground">{money(pending)}</p>
        </div>
      </div>

      {couponRequiresDeposit ? (
        <p className={`mt-3 text-[0.9375rem] font-semibold ${meetsHalf ? "text-foreground" : "text-yellow-text"}`}>
          {meetsHalf
            ? "✓ Cubre el 50%: el cupón con anticipo es válido."
            : "El cupón de este pedido solo vale si el anticipo cubre el 50%."}
        </p>
      ) : null}

      {!locked ? (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-[160px] flex-1">
            <span className="mb-1.5 block text-[0.9375rem] font-semibold text-foreground">
              {depositAmount ? "Corregir monto" : "Monto recibido"}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldClass}
              disabled={busy}
            />
          </label>
          <button
            type="button"
            disabled={busy || !(Number(amount) > 0)}
            onClick={() => save(Number(amount))}
            className={buttonClass("ink")}
          >
            {busy ? "Guardando…" : depositAmount ? "Actualizar" : "Registrar anticipo"}
          </button>
          {depositAmount ? (
            <button type="button" disabled={busy} onClick={() => save(null)} className={buttonClass("ghost")}>
              Quitar
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-[0.9375rem] text-brand-red-dark dark:text-brand-red">{error}</p> : null}
    </section>
  );
}

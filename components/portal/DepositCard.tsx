import { MessageCircle, Wallet } from "lucide-react";

interface Props {
  /** Total ya con descuento. */
  total: number;
  /** Total sin el cupón (para explicar qué pasa si no deja anticipo). */
  totalWithoutCoupon: number;
  depositAmount: number | null;
  depositPaidAt: string | null;
  couponTitle: string | null;
  couponRequiresDeposit: boolean;
  whatsappHref: string;
}

const money = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

/** Anticipo del pedido en el portal, con botón para mandar el comprobante. */
export function DepositCard({
  total,
  totalWithoutCoupon,
  depositAmount,
  depositPaidAt,
  couponTitle,
  couponRequiresDeposit,
  whatsappHref,
}: Props) {
  const half = Math.ceil(total * 0.5);
  const paid = depositAmount ?? 0;
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
            Para empezar dejas el 50% ({money(half)}); el resto, al recoger tu coche.
          </p>
        </div>
      </div>

      {depositAmount ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-highlight p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Ya dejaste</p>
            <p className="mt-1 font-display text-[1.75rem] font-extrabold leading-none text-foreground">{money(paid)}</p>
            {depositPaidAt ? (
              <p className="mt-1 text-[0.8125rem] text-muted">
                {new Date(depositPaidAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Merida" })}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border-2 border-dashed border-seam p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Pagas al recoger</p>
            <p className="mt-1 font-display text-[1.75rem] font-extrabold leading-none text-foreground">
              {money(Math.max(total - paid, 0))}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[0.9375rem] text-foreground">
          Puedes pagarlo en el taller o por transferencia. Si transfieres, mándanos la captura del comprobante por
          WhatsApp para registrarlo.
        </p>
      )}

      {couponRequiresDeposit && couponTitle ? (
        <p
          className={`mt-4 rounded-xl border-2 border-dashed px-3.5 py-2.5 text-[0.9375rem] ${
            meetsHalf
              ? "border-seam text-foreground"
              : "border-brand-yellow-dark/60 bg-highlight text-foreground dark:border-brand-yellow/50"
          }`}
        >
          {meetsHalf
            ? `✓ Tu cupón "${couponTitle}" ya es válido.`
            : `Tu cupón "${couponTitle}" solo aplica si dejas el 50% de anticipo. Sin él, el total sería ${money(totalWithoutCoupon)}.`}
        </p>
      ) : null}

      {!meetsHalf ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#25D366] px-5 font-semibold text-white"
        >
          <MessageCircle size={18} /> Mandar comprobante por WhatsApp
        </a>
      ) : null}
    </section>
  );
}

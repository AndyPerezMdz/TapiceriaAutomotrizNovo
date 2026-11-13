"use client";

import { buttonClass, fieldClass, labelClass } from "@/components/taller";
import { useToast } from "@/components/shared/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface WelcomeCouponSettings {
  is_enabled: boolean;
  title: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  first_order_only: boolean;
  valid_days: number | null;
  requires_deposit: boolean;
}

interface Props {
  settings: WelcomeCouponSettings;
  stats: { issued: number; used: number; unused: number };
}

/** Cupón que recibe cada cliente al crear su cuenta. Lo edita el admin. */
export function WelcomeCouponForm({ settings, stats }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(settings.is_enabled);
  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description ?? "");
  const [discountType, setDiscountType] = useState(settings.discount_type);
  const [discountValue, setDiscountValue] = useState(String(settings.discount_value));
  const [firstOrderOnly, setFirstOrderOnly] = useState(settings.first_order_only);
  const [validDays, setValidDays] = useState(settings.valid_days ? String(settings.valid_days) : "");
  const [requiresDeposit, setRequiresDeposit] = useState(settings.requires_deposit);
  const [applyToUnused, setApplyToUnused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label =
    discountType === "percentage"
      ? `${discountValue || 0}% de descuento`
      : `$${Number(discountValue || 0).toLocaleString("es-MX")} de descuento`;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const value = Number(discountValue);
    if (!title.trim()) return setError("Ponle un título al cupón.");
    if (!(value > 0)) return setError("Escribe un descuento mayor a cero.");
    if (discountType === "percentage" && value > 100) return setError("El porcentaje no puede pasar de 100.");
    const days = validDays.trim() ? Number(validDays) : null;
    if (days !== null && !(Number.isInteger(days) && days > 0)) return setError("Los días de vigencia deben ser un número entero.");

    setSaving(true);
    const { data, error: rpcError } = await createClient().rpc("update_welcome_coupon", {
      p_is_enabled: enabled,
      p_title: title.trim(),
      p_description: description.trim() || null,
      p_discount_type: discountType,
      p_discount_value: value,
      p_first_order_only: firstOrderOnly,
      p_valid_days: days,
      p_requires_deposit: requiresDeposit,
      p_apply_to_unused: applyToUnused,
    });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    showToast(
      applyToUnused && typeof data === "number"
        ? `Guardado. Se actualizaron ${data} cupones que aún no se usaban.`
        : "Guardado. Los clientes que se registren desde ahora recibirán este cupón.",
    );
    setApplyToUnused(false);
    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-[18px] bg-surface dark:ring-1 dark:ring-white/5">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-ink px-5 py-5 text-on-ink sm:px-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-ink">
            <Gift size={22} />
          </span>
          <div>
            <h2 className="font-display text-[1.75rem] font-bold uppercase leading-none">Cupón de bienvenida</h2>
            <p className="mt-1 text-[0.9375rem] text-on-ink-muted">
              Se le da automáticamente a cada cliente al crear su cuenta, ya activado.
            </p>
          </div>
        </div>
        <dl className="flex gap-6 text-center">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Entregados</dt>
            <dd className="font-display text-[1.75rem] font-extrabold leading-none">{stats.issued}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Usados</dt>
            <dd className="font-display text-[1.75rem] font-extrabold leading-none text-brand-yellow">{stats.used}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Sin usar</dt>
            <dd className="font-display text-[1.75rem] font-extrabold leading-none">{stats.unused}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={save} className="space-y-5 p-5 sm:p-7">
        <label className="flex items-center gap-3 text-[1.0625rem] font-semibold text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 accent-[#1a1a1a]"
            disabled={saving}
          />
          {enabled ? "Activo: los clientes nuevos lo reciben" : "Pausado: los clientes nuevos no reciben cupón"}
        </label>

        <fieldset disabled={saving || !enabled} className="space-y-4 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wc-title" className={labelClass}>Título</label>
              <input id="wc-title" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="wc-desc" className={labelClass}>Descripción (opcional)</label>
              <input id="wc-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="wc-type" className={labelClass}>Tipo de descuento</label>
              <select
                id="wc-type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                className={fieldClass}
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label htmlFor="wc-value" className={labelClass}>Valor ({discountType === "percentage" ? "%" : "$"})</label>
              <input
                id="wc-value"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="wc-days" className={labelClass}>Vence a los … días (opcional)</label>
              <input
                id="wc-days"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="Vacío = no vence"
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border-2 border-dashed border-seam p-4">
            <label className="flex items-start gap-3 text-[0.9375rem] text-foreground">
              <input
                type="checkbox"
                checked={firstOrderOnly}
                onChange={(e) => setFirstOrderOnly(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#1a1a1a]"
              />
              <span>
                <strong>Solo en su primer pedido</strong>
                <span className="block text-muted">Si ya hizo un pedido sin usarlo, el cupón se le marca como caducado.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-[0.9375rem] text-foreground">
              <input
                type="checkbox"
                checked={requiresDeposit}
                onChange={(e) => setRequiresDeposit(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#1a1a1a]"
              />
              <span>
                <strong>Solo válido con anticipo del 50%</strong>
                <span className="block text-muted">Si se entrega sin anticipo, se cobra sin descuento.</span>
              </span>
            </label>
          </div>
        </fieldset>

        <p className="rounded-xl bg-highlight px-4 py-3 text-[0.9375rem] text-foreground">
          {enabled ? (
            <>
              Un cliente nuevo verá: <strong>“{title || "Sin título"}” · {label}</strong>
              {firstOrderOnly ? " · solo en su primer pedido" : ""}
              {validDays ? ` · vence a los ${validDays} días` : ""}
              {requiresDeposit ? " · con anticipo del 50%" : ""}.
            </>
          ) : (
            "Mientras esté pausado, las cuentas nuevas no reciben cupón de bienvenida."
          )}
        </p>

        {stats.unused > 0 ? (
          <label className="flex items-start gap-3 text-[0.9375rem] text-foreground">
            <input
              type="checkbox"
              checked={applyToUnused}
              onChange={(e) => setApplyToUnused(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#1a1a1a]"
              disabled={saving}
            />
            <span>
              Aplicar también a los <strong>{stats.unused}</strong> cupones de bienvenida que ya se entregaron y no se han
              usado
              <span className="block text-muted">
                Si no lo marcas, solo cambia para los que se registren de aquí en adelante. La vigencia de los ya
                entregados no cambia.
              </span>
            </span>
          </label>
        ) : null}

        {error ? <p className="text-[0.9375rem] text-brand-red-dark dark:text-brand-red">{error}</p> : null}

        <button type="submit" disabled={saving} className={buttonClass("ink", "lg")}>
          {saving ? "Guardando…" : "Guardar cupón de bienvenida"}
        </button>
      </form>
    </section>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Service {
  id: string;
  title: string;
}

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";
const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

export function CouponForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [audience, setAudience] = useState<"clientes" | "frecuentes" | "ambos">("ambos");
  const [serviceId, setServiceId] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Ingresa un título para el cupón.");
      return;
    }

    const value = Number(discountValue);
    if (!value || value <= 0) {
      setError("Ingresa un valor de descuento válido.");
      return;
    }
    if (discountType === "percentage" && value > 100) {
      setError("El porcentaje no puede ser mayor a 100.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("coupons").insert({
      title: title.trim(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: value,
      audience,
      service_id: serviceId || null,
      expires_at: expiresAt || null,
    });

    if (insertError) {
      setError("No se pudo crear el cupón. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    setTitle("");
    setDescription("");
    setDiscountValue("");
    setServiceId("");
    setExpiresAt("");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <h2 className="text-sm font-semibold text-foreground">Nuevo cupón</h2>

      {error ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      <div>
        <label className={labelClassName}>Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Descuento de verano"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div>
        <label className={labelClassName}>Descripción (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Ej. Válido en tapizado de asientos durante agosto"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div>
        <label className={labelClassName}>¿Aplica a un servicio específico?</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className={fieldClassName}
          disabled={isSaving}
        >
          <option value="">General (cualquier servicio)</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Tipo de descuento</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
            className={fieldClassName}
            disabled={isSaving}
          >
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed">Monto fijo ($)</option>
          </select>
        </div>

        <div>
          <label className={labelClassName}>
            Valor {discountType === "percentage" ? "(%)" : "($ MXN)"}
          </label>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === "percentage" ? "15" : "500"}
            className={fieldClassName}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>¿Para quién es?</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
            className={fieldClassName}
            disabled={isSaving}
          >
            <option value="clientes">Clientes (no frecuentes)</option>
            <option value="frecuentes">Solo clientes frecuentes</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>

        <div>
          <label className={labelClassName}>Fecha de caducidad (opcional)</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className={fieldClassName}
            disabled={isSaving}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Guardando..." : "Crear cupón"}
      </button>
    </form>
  );
}
"use client";

import { statusLabels } from "@/lib/validations/admin-order";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, AlertTriangle, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getAllowedStatuses(current: string): string[] {
  const transitions: Record<string, string[]> = {
    pendiente_revision: ["pendiente_revision", "cotizado", "cancelado"],
    cotizado: ["cotizado", "cancelado"],
    aprobado: ["aprobado", "en_proceso", "cancelado"],
    rechazado: ["rechazado", "cancelado"],
    en_proceso: ["en_proceso", "listo_para_entrega", "cancelado"],
    listo_para_entrega: ["listo_para_entrega", "entregado", "cancelado"],
    entregado: ["entregado"],
    cancelado: ["cancelado"],
  };
  return transitions[current] ?? [current];
}

interface OrderItem {
  id: string;
  serviceTitle: string | null;
  serviceId: string | null;
  materialLabel: string | null;
}

interface Coupon {
  title: string;
  discount_type: string;
  discount_value: number;
  service_id: string | null;
}

interface Props {
  orderId: string;
  currentStatus: string;
  items: OrderItem[];
  isAdmin: boolean;
  clientPhone: string | null;
  clientName: string | null;
  vehicleLabel: string;
  coupon?: Coupon | null;
}

export function OrderStaffPanel({
  orderId,
  currentStatus,
  items,
  isAdmin,
  clientPhone,
  clientName,
  vehicleLabel,
  coupon,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [originalPrices, setOriginalPrices] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("order_items")
      .select("id, price")
      .eq("order_id", orderId)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((row) => {
          map[row.id] = row.price !== null ? String(row.price) : "";
        });
        setPrices(map);
        setOriginalPrices(map);
      });

    supabase
      .from("business_settings")
      .select("whatsapp")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setWhatsappNumber(data.whatsapp);
      });
  }, [orderId]);

  const isLocked = currentStatus === "cancelado" || currentStatus === "entregado";
  const priceChanged =
    isAdmin && items.some((item) => (prices[item.id] ?? "") !== (originalPrices[item.id] ?? ""));

  function itemDiscount(item: OrderItem): number {
    if (!coupon) return 0;
    const raw = Number(prices[item.id]) || 0;
    if (coupon.service_id !== null && coupon.service_id === item.serviceId) {
      return coupon.discount_type === "percentage"
        ? raw * (coupon.discount_value / 100)
        : Math.min(coupon.discount_value, raw);
    }
    return 0;
  }

  const rawTotal = items.reduce((sum, item) => sum + (Number(prices[item.id]) || 0), 0);
  const itemLevelDiscount = items.reduce((sum, item) => sum + itemDiscount(item), 0);

  let total = rawTotal - itemLevelDiscount;
  let generalDiscountAmount = 0;

  if (coupon && coupon.service_id === null && rawTotal > 0) {
    generalDiscountAmount =
      coupon.discount_type === "percentage"
        ? total * (coupon.discount_value / 100)
        : Math.min(coupon.discount_value, total);
    total = total - generalDiscountAmount;
  }

  total = Math.max(total, 0);

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    const finalStatus = priceChanged ? "cotizado" : status;

    const hasAnyPrice = items.some((item) => Number(prices[item.id]) > 0);
    if (finalStatus === "cotizado" && !hasAnyPrice) {
      setSaveError("Ingresa al menos un precio antes de marcar el pedido como Cotizado.");
      setIsSaving(false);
      return;
    }

    const supabase = createClient();

    if (isAdmin) {
      for (const item of items) {
        const value = prices[item.id] ? Number(prices[item.id]) : null;
        await supabase.from("order_items").update({ price: value }).eq("id", item.id);
      }
    }

    const updatePayload: Record<string, unknown> = { status: finalStatus };

    if (isAdmin) {
      const numericTotal = hasAnyPrice ? total : null;
      updatePayload.estimated_price = numericTotal;
      if (finalStatus === "entregado") {
        updatePayload.final_price = numericTotal;
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      setSaveError("No se pudo guardar. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    if (note.trim()) {
      const { data: lastHistoryEntry } = await supabase
        .from("order_status_history")
        .select("id")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastHistoryEntry) {
        await supabase
          .from("order_status_history")
          .update({ note: note.trim() })
          .eq("id", lastHistoryEntry.id);
      }
    }

    fetch("/api/notify/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});

    setOriginalPrices(prices);
    router.refresh();
    setIsSaving(false);
    setNote("");
  }

  const whatsappHref =
    clientPhone && whatsappNumber
      ? buildWhatsAppLink(
          priceChanged
            ? `Hola ${clientName ?? ""}, actualizamos el precio de tu pedido de ${vehicleLabel}. Revísalo y confírmanos si lo aceptas.`
            : `Hola ${clientName ?? ""}, tu pedido de ${vehicleLabel} cambió de estado a: ${statusLabels[status]}.`,
          clientPhone,
        )
      : null;

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Gestión del pedido
      </h2>

      {coupon ? (
        <div className="mb-4 flex items-center gap-1.5 rounded-md border border-brand-yellow/30 bg-brand-yellow/10 px-3.5 py-2.5 text-sm text-brand-yellow-dark dark:text-brand-yellow">
          <Tag size={14} />
          Cupón &quot;{coupon.title}&quot; aplicado
          {coupon.service_id === null ? " (descuento al total)" : " (descuento a un servicio)"}.
        </div>
      ) : null}

      {isLocked ? (
        <div className="mb-4 rounded-md border border-black/10 bg-black/5 px-3.5 py-2.5 text-sm text-muted dark:border-white/10 dark:bg-white/5">
          Este pedido ya está en un estado final y no se puede editar.
        </div>
      ) : null}

      {saveError ? (
        <div className="mb-4 rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {saveError}
        </div>
      ) : null}

      {priceChanged ? (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-brand-yellow/30 bg-brand-yellow/10 px-3.5 py-2.5 text-sm text-brand-yellow-dark dark:text-brand-yellow">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Cambiaste un precio. Al guardar, el pedido regresará a &quot;Cotizado&quot; para que
            el cliente vuelva a aceptar o rechazar.
          </span>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isLocked || priceChanged}
            className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15"
          >
            {getAllowedStatuses(currentStatus).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
          {priceChanged ? (
            <p className="mt-1 text-xs text-muted">
              Deshabilitado mientras haya un cambio de precio pendiente de guardar.
            </p>
          ) : null}
        </div>

        {isAdmin ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Precio {status === "entregado" ? "final" : "estimado"} por servicio (MXN)
            </p>
            {items.map((item) => {
              const discount = itemDiscount(item);
              return (
                <div key={item.id}>
                  <label className="mb-1 block text-xs text-muted">
                    {item.serviceTitle ?? "Servicio"}
                    {item.materialLabel ? ` — ${item.materialLabel}` : ""}
                  </label>
                  <input
                    type="number"
                    value={prices[item.id] ?? ""}
                    onChange={(e) =>
                      setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="0.00"
                    disabled={isLocked}
                    className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15"
                  />
                  {discount > 0 ? (
                    <p className="mt-1 text-xs text-brand-yellow-dark dark:text-brand-yellow">
                      Con cupón: ${(Number(prices[item.id]) || 0).toLocaleString("es-MX")} −{" "}
                      {coupon?.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `$${coupon?.discount_value.toLocaleString("es-MX")}`}{" "}
                      = $
                      {((Number(prices[item.id]) || 0) - discount).toLocaleString("es-MX", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  ) : null}
                </div>
              );
            })}

            <div className="border-t border-black/10 pt-3 dark:border-white/10">
              {generalDiscountAmount > 0 ? (
                <p className="mb-1 text-xs text-brand-yellow-dark dark:text-brand-yellow">
                  Descuento general del cupón: -${generalDiscountAmount.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                </p>
              ) : null}
              <p className="text-sm font-semibold text-foreground">
                Total: ${total.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted">Este es el total que verá el cliente.</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Solo un administrador puede fijar precios.
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Nota para este cambio (opcional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ej. Se retrasó por falta de material..."
            disabled={isLocked}
            className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || isLocked}
          className="w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-brand-black"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-md border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2.5 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/20"
          >
            <MessageCircle size={16} /> Avisar por WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
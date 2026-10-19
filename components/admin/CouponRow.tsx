"use client";

import { useConfirm } from "@/lib/hooks/useConfirm";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  audience: string;
  is_active: boolean;
  service_title: string | null;
  expires_at: string | null;
}

const audienceLabels: Record<string, string> = {
  clientes: "Clientes",
  frecuentes: "Frecuentes",
  ambos: "Ambos",
};

export function CouponRow({ coupon }: { coupon: Coupon }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const { confirm, dialog } = useConfirm();

  async function toggleActive() {
    setIsUpdating(true);
    const supabase = createClient();
    await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);
    router.refresh();
    setIsUpdating(false);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar cupón",
      description: `Esto eliminará permanentemente el cupón "${coupon.title}". Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    setIsUpdating(true);
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", coupon.id);
    router.refresh();
    setIsUpdating(false);
  }

  const discountLabel =
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% de descuento`
      : `$${coupon.discount_value.toLocaleString("es-MX")} de descuento`;

  const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;

  return (
    <>
      {dialog}
      <div className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">{coupon.title}</p>
            <p className="mt-0.5 text-[15px] text-yellow-text">
              {discountLabel}
            </p>
            {coupon.description ? (
              <p className="mt-1 text-[13px] text-muted">{coupon.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-[13px] text-muted dark:bg-white/5">
                {audienceLabels[coupon.audience]}
              </span>
              <span className="inline-block rounded-full bg-brand-yellow text-ink px-2.5 py-0.5 text-[13px]">
                {coupon.service_title ?? "General"}
              </span>
              {coupon.expires_at ? (
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[13px] ${
                    isExpired
                      ? "border-[1.5px] border-brand-red-dark text-brand-red-dark dark:border-brand-red dark:text-brand-red"
                      : "border-[1.5px] border-dashed border-foreground text-foreground"
                  }`}
                >
                  {isExpired ? "Caducado" : "Vence"}{" "}
                  {new Date(`${coupon.expires_at}T00:00:00`).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              onClick={toggleActive}
              disabled={isUpdating}
              className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] transition disabled:opacity-50 ${
                coupon.is_active
                  ? "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40"
                  : "border-[1.5px] border-muted text-muted"
              }`}
            >
              {coupon.is_active ? "Activo" : "Inactivo"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="text-muted transition hover:text-brand-red disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
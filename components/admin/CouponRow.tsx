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
      <div className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">{coupon.title}</p>
            <p className="mt-0.5 text-sm text-brand-yellow-dark dark:text-brand-yellow">
              {discountLabel}
            </p>
            {coupon.description ? (
              <p className="mt-1 text-xs text-muted">{coupon.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-muted dark:bg-white/5">
                {audienceLabels[coupon.audience]}
              </span>
              <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {coupon.service_title ?? "General"}
              </span>
              {coupon.expires_at ? (
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${
                    isExpired
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
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
              className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                coupon.is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
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
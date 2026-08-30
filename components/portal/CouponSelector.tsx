"use client";

import { createClient } from "@/lib/supabase/client";
import { Tag } from "lucide-react";
import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number;
}

export function CouponSelector({
  serviceId,
  selectedCouponId,
  onSelect,
}: {
  serviceId: string | null;
  selectedCouponId: string | null;
  onSelect: (couponId: string | null) => void;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    if (!serviceId) {
      setCoupons([]);
      onSelect(null);
      return;
    }

    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: isFrequent } = await supabase.rpc("is_frequent_client", {
        p_client_id: user.id,
      });

      const audienceFilter = isFrequent ? ["frecuentes", "ambos"] : ["clientes", "ambos"];

      const [{ data: availableCoupons }, { data: redemptions }] = await Promise.all([
        supabase
          .from("coupons")
          .select("id, title, discount_type, discount_value, service_id")
          .eq("is_active", true)
          .in("audience", audienceFilter)
          .or(`service_id.is.null,service_id.eq.${serviceId}`),
        supabase.from("coupon_redemptions").select("coupon_id").eq("client_id", user.id),
      ]);

      const usedIds = new Set(redemptions?.map((r) => r.coupon_id) ?? []);
      setCoupons((availableCoupons ?? []).filter((c) => !usedIds.has(c.id)));
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  if (coupons.length === 0) return null;

  return (
    <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Tag size={13} /> Tienes cupones disponibles para este servicio
      </p>
      <div className="space-y-2">
        {coupons.map((c) => {
          const discountLabel =
            c.discount_type === "percentage"
              ? `${c.discount_value}% de descuento`
              : `$${c.discount_value.toLocaleString("es-MX")} de descuento`;
          const isSelected = selectedCouponId === c.id;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : c.id)}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                isSelected
                  ? "border-brand-yellow-dark bg-brand-yellow/10"
                  : "border-black/15 hover:border-black/30 dark:border-white/15"
              }`}
            >
              <span>
                <span className="font-medium text-foreground">{c.title}</span>{" "}
                <span className="text-muted">— {discountLabel}</span>
              </span>
              {isSelected ? (
                <span className="text-xs font-medium text-brand-yellow-dark dark:text-brand-yellow">
                  Aplicado ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
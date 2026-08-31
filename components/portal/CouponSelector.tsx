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
  const [activeCouponId, setActiveCouponId] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setCoupons([]);
      onSelect(null);
      return;
    }

    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: isFrequent } = await supabase.rpc("is_frequent_client", {
        p_client_id: user.id,
      });

      const audienceFilter = isFrequent ? ["frecuentes", "ambos"] : ["clientes", "ambos"];

      const [{ data: availableCoupons }, { data: redemptions }, { data: active }] =
        await Promise.all([
          supabase
            .from("coupons")
            .select("id, title, discount_type, discount_value, service_id, expires_at")
            .eq("is_active", true)
            .in("audience", audienceFilter)
            .or(`service_id.is.null,service_id.eq.${serviceId}`),
          supabase.from("coupon_redemptions").select("coupon_id").eq("client_id", user.id),
          supabase
            .from("active_coupons")
            .select("coupon_id")
            .eq("client_id", user.id)
            .maybeSingle(),
        ]);

      const usedIds = new Set(redemptions?.map((r) => r.coupon_id) ?? []);
      const valid = (availableCoupons ?? []).filter(
        (c) => !usedIds.has(c.id) && (!c.expires_at || c.expires_at >= today),
      );
      setCoupons(valid);

      const activeId = active?.coupon_id ?? null;
      setActiveCouponId(activeId);

      if (activeId && valid.some((c) => c.id === activeId)) {
        onSelect(activeId);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  if (coupons.length === 0) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Tag size={16} /> Cupón disponible para este servicio
      </h2>
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
                {activeCouponId === c.id ? (
                  <span className="ml-1.5 text-xs text-brand-yellow-dark dark:text-brand-yellow">
                    (activado desde Mis cupones)
                  </span>
                ) : null}
              </span>
              {isSelected ? (
                <span className="text-xs font-medium text-brand-yellow-dark dark:text-brand-yellow">
                  Canjear ✓
                </span>
              ) : (
                <span className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
                  Activar
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
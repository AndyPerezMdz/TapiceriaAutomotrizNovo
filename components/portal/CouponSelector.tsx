"use client";

import { createClient } from "@/lib/supabase/client";
import { Tag } from "lucide-react";
import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number;
  service_id: string | null;
}

export function CouponSelector({
  serviceIds,
  selectedCouponId,
  onSelect,
}: {
  serviceIds: string[];
  selectedCouponId: string | null;
  onSelect: (couponId: string | null) => void;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const serviceKey = serviceIds.filter(Boolean).sort().join(",");

  useEffect(() => {
    const validIds = serviceIds.filter(Boolean);
    if (validIds.length === 0) {
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

      const [{ data: availableCoupons }, { data: redemptions }] = await Promise.all([
        supabase
          .from("coupons")
          .select("id, title, discount_type, discount_value, service_id, expires_at")
          .eq("is_active", true)
          .in("audience", audienceFilter),
        supabase.from("coupon_redemptions").select("coupon_id").eq("client_id", user.id),
      ]);

      const usedIds = new Set(redemptions?.map((r) => r.coupon_id) ?? []);

      const valid = (availableCoupons ?? []).filter(
        (c) =>
          !usedIds.has(c.id) &&
          (!c.expires_at || c.expires_at >= today) &&
          (c.service_id === null || validIds.includes(c.service_id)),
      );
      setCoupons(valid);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceKey]);

  if (coupons.length === 0) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Tag size={16} /> Cupón disponible para tu pedido
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
                {c.service_id === null ? (
                  <span className="ml-1.5 text-xs text-muted">(general)</span>
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
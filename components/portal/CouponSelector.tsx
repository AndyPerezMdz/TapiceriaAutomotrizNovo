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
    <fieldset className="min-w-0 rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      <legend className="float-left mb-5 flex w-full items-center gap-3 p-0">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ink text-brand-yellow dark:ring-1 dark:ring-white/10">
          <Tag size={17} />
        </span>
        <span className="font-display text-[26px] font-bold uppercase leading-none text-foreground">
          ¿Usas un cupón?
        </span>
      </legend>
      <div className="clear-both grid gap-2.5 sm:grid-cols-2">
        {coupons.map((c) => {
          const discountLabel =
            c.discount_type === "percentage"
              ? `${c.discount_value}% menos`
              : `$${c.discount_value.toLocaleString("es-MX")} menos`;
          const isSelected = selectedCouponId === c.id;

          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : c.id)}
              className={`relative min-h-[84px] rounded-xl px-4 py-3.5 text-left transition ${
                isSelected
                  ? "bg-brand-yellow text-ink"
                  : "border-2 border-dashed border-field-border bg-surface text-foreground hover:border-foreground"
              }`}
            >
              {isSelected ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-[5px] rounded-2xl border-2 border-dashed border-ink/35"
                />
              ) : null}
              <span className="relative block font-display text-2xl font-extrabold uppercase leading-none">
                {discountLabel}
              </span>
              <span className={`relative mt-1 block text-[13px] ${isSelected ? "text-[#2b2400]" : "text-muted"}`}>
                {c.title}
                {c.service_id === null ? " · general" : ""}
              </span>
              <span className="relative mt-1 block text-[13px] font-semibold">
                {isSelected ? "Aplicado ✓ (toca para quitarlo)" : "Usar este cupón"}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

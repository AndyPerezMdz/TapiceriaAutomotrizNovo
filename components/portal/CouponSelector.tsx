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

    async function load() {
      // La base de datos ya filtra por audiencia, vigencia y si ya lo usó.
      const { data } = await supabase.rpc("get_my_coupons");
      const valid = ((data ?? []) as (Coupon & { status: string })[]).filter(
        (c) => c.status === "activo" && (c.service_id === null || validIds.includes(c.service_id)),
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
        <span className="font-display text-[1.625rem] font-bold uppercase leading-none text-foreground">
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
              <span className={`relative mt-1 block text-[0.8125rem] ${isSelected ? "text-[#2b2400]" : "text-muted"}`}>
                {c.title}
                {c.service_id === null ? " · general" : ""}
              </span>
              <span className="relative mt-1 block text-[0.8125rem] font-semibold">
                {isSelected ? "Aplicado ✓ (toca para quitarlo)" : "Usar este cupón"}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

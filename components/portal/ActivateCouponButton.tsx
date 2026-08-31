"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActivateCouponButton({
  couponId,
  isActive,
}: {
  couponId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleClick() {
    setIsSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSaving(false);
      return;
    }

    if (isActive) {
      await supabase.from("active_coupons").delete().eq("client_id", user.id);
    } else {
      await supabase
        .from("active_coupons")
        .upsert({ client_id: user.id, coupon_id: couponId });
    }

    router.refresh();
    setIsSaving(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSaving}
      className={`mt-3 rounded-md px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
        isActive
          ? "border border-brand-yellow-dark bg-brand-yellow/20 text-brand-yellow-dark dark:text-brand-yellow"
          : "bg-brand-black text-white hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
      }`}
    >
      {isSaving ? "..." : isActive ? "Activado ✓ (clic para quitar)" : "Activar cupón"}
    </button>
  );
}
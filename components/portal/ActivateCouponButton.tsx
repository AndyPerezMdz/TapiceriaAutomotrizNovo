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
      className={`mt-4 inline-flex min-h-11 items-center rounded-xl px-5 text-[15px] font-semibold transition disabled:opacity-60 ${
        isActive
          ? "border-[1.5px] border-ink bg-transparent text-ink"
          : "bg-ink text-brand-yellow hover:bg-ink-soft"
      }`}
    >
      {isSaving ? "..." : isActive ? "Activado ✓ (clic para quitar)" : "Activar cupón"}
    </button>
  );
}
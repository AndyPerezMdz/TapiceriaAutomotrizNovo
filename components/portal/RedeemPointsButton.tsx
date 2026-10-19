"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RedeemPointsButton({ canRedeem }: { canRedeem: boolean }) {
  const router = useRouter();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRedeem() {
    setIsRedeeming(true);
    setError(null);
    const supabase = createClient();
    const { error: redeemError } = await supabase.rpc("redeem_loyalty_points");

    if (redeemError) {
      setError(redeemError.message);
      setIsRedeeming(false);
      return;
    }

    setSuccess(true);
    setIsRedeeming(false);
    router.refresh();
  }

  if (success) {
    return (
      <p className="text-[15px] font-semibold text-brand-yellow">
        ¡Canjeado! Revisa tus cupones activos.
      </p>
    );
  }

  return (
    <div>
      {error ? <p className="mb-2 text-[15px] text-brand-red">{error}</p> : null}
      <button
        onClick={handleRedeem}
        disabled={!canRedeem || isRedeeming}
        className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-50 min-h-11 inline-flex items-center justify-center"
      >
        {isRedeeming ? "Canjeando..." : "Canjear puntos"}
      </button>
    </div>
  );
}
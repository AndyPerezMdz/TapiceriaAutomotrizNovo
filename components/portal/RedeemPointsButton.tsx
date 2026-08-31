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
      <p className="text-sm font-medium text-green-700 dark:text-green-400">
        ¡Canjeado! Revisa tus cupones activos.
      </p>
    );
  }

  return (
    <div>
      {error ? <p className="mb-2 text-sm text-brand-red">{error}</p> : null}
      <button
        onClick={handleRedeem}
        disabled={!canRedeem || isRedeeming}
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-brand-black"
      >
        {isRedeeming ? "Canjeando..." : "Canjear puntos"}
      </button>
    </div>
  );
}
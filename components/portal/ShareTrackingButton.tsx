"use client";
import { buttonClass } from "@/components/taller";

import { createClient } from "@/lib/supabase/client";
import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareTrackingButton({
  orderId,
  existingToken,
}: {
  orderId: string;
  existingToken: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleShare() {
    setIsLoading(true);
    const supabase = createClient();

    let token = existingToken;

    if (!token) {
      const { data, error } = await supabase.rpc("generate_share_token", {
        p_order_id: orderId,
      });

      if (error || !data) {
        setIsLoading(false);
        return;
      }

      token = data;
    }

    const url = `${window.location.origin}/seguimiento/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setIsLoading(false);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className={buttonClass("primary")}
    >
      {copied ? (
        <>
          <Check size={17} /> Link copiado
        </>
      ) : (
        <>
          <Share2 size={17} /> Compartir seguimiento
        </>
      )}
    </button>
  );
}
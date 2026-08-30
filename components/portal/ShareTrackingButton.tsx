"use client";

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
      className="flex w-fit items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
    >
      {copied ? (
        <>
          <Check size={13} /> Link copiado
        </>
      ) : (
        <>
          <Share2 size={13} /> Compartir seguimiento
        </>
      )}
    </button>
  );
}
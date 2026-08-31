"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export function ApplyPendingReferral() {
  useEffect(() => {
    const pending = localStorage.getItem("pending_referral");
    if (!pending) return;

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("referred_by")
      .then(async () => {
        // Con sesión activa, intenta aplicarlo
        await supabase.rpc("set_referred_by", { p_referred_by: pending });
        localStorage.removeItem("pending_referral");
      });
  }, []);

  return null;
}
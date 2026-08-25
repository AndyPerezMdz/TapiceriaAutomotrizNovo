"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export function MarkAsViewed({ orderId }: { orderId: string }) {
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("orders")
      .update({ client_last_viewed_at: new Date().toISOString() })
      .eq("id", orderId)
      .then();
  }, [orderId]);

  return null;
}
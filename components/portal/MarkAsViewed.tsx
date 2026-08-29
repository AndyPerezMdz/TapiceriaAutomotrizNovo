"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export function MarkAsViewed({ orderId }: { orderId: string }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("mark_order_viewed", { p_order_id: orderId }).then();
  }, [orderId]);

  return null;
}
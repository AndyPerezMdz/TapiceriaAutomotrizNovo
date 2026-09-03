"use client";

import { createClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";
import { useState } from "react";

export function MarketingOptInToggle({ initialValue }: { initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  async function handleToggle() {
    const newValue = !enabled;
    setEnabled(newValue);
    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        await supabase.rpc("set_marketing_opt_in", { p_value: newValue });
    }
        setIsSaving(false);
    }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
      <div className="flex items-start gap-2.5">
        <Mail size={16} className="mt-0.5 shrink-0 text-muted" />
        <div>
          <p className="text-sm font-medium text-foreground">Correos promocionales</p>
          <p className="text-xs text-muted">
            Recibe avisos de cupones nuevos y novedades del taller.
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={isSaving}
        role="switch"
        aria-checked={enabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
          enabled ? "bg-brand-yellow" : "bg-black/15 dark:bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
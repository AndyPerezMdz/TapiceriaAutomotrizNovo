"use client";

import { Check, Copy, Users } from "lucide-react";
import { useState } from "react";

export function ReferralLink({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/registro?ref=${userId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-surface p-6 text-center dark:ring-1 dark:ring-white/5">
      <Users size={28} className="mx-auto mb-2 text-yellow-text" />
      <p className="mb-1 text-[15px] font-semibold text-foreground">Tu link para referir</p>
      <p className="mb-4 text-[13px] text-muted">
        Compártelo con tus amigos. Cuando alguien se registre con tu link y
        complete su primer pedido, ambos reciben un cupón de descuento.
      </p>

      <button
        onClick={handleCopy}
        className="mx-auto flex items-center gap-2 rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-5 py-2.5 text-[15px] font-semibold text-ink transition min-h-11"
      >
        {copied ? (
          <>
            <Check size={15} /> ¡Copiado!
          </>
        ) : (
          <>
            <Copy size={15} /> Copiar mi link
          </>
        )}
      </button>
    </div>
  );
}
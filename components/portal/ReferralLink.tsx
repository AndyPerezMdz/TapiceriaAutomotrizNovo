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
    <div className="rounded-lg border border-black/10 bg-surface p-6 text-center dark:border-white/10">
      <Users size={28} className="mx-auto mb-2 text-brand-yellow-dark dark:text-brand-yellow" />
      <p className="mb-1 text-sm font-semibold text-foreground">Tu link para referir</p>
      <p className="mb-4 text-xs text-muted">
        Compártelo con tus amigos. Cuando alguien se registre con tu link y
        complete su primer pedido, ambos reciben un cupón de descuento.
      </p>

      <button
        onClick={handleCopy}
        className="mx-auto flex items-center gap-2 rounded-md bg-brand-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
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
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
});

export function MagicLinkForm({ redirectPath }: { redirectPath: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fieldClassName =
    "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0] ?? "Correo inválido");
      return;
    }

    setIsSending(true);
    const supabase = createClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${redirectPath}`,
      },
    });

    if (sendError) {
      setError("No se pudo enviar el enlace. Intenta de nuevo.");
      setIsSending(false);
      return;
    }

    setSuccess(true);
    setIsSending(false);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-[15px] text-green-700 dark:text-green-400">
        Revisa tu correo — te enviamos un enlace para iniciar sesión sin
        contraseña.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-[15px] text-brand-red">
          {error}
        </div>
      ) : null}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        aria-label="Correo electrónico"
        autoComplete="email"
        className={fieldClassName}
        disabled={isSending}
      />

      <button
        type="submit"
        disabled={isSending}
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand-yellow px-6 text-[17px] font-bold text-ink transition hover:bg-[#e8b90f] disabled:opacity-60"
      >
        {isSending ? "Enviando…" : "Mandarme el enlace"}
      </button>
    </form>
  );
}
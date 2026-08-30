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
    "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

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
      <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
        Revisa tu correo — te enviamos un enlace para iniciar sesión sin
        contraseña.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        className={fieldClassName}
        disabled={isSending}
      />

      <button
        type="submit"
        disabled={isSending}
        className="w-full rounded-md border border-black/15 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
      >
        {isSending ? "Enviando..." : "Enviarme un enlace mágico"}
      </button>
    </form>
  );
}
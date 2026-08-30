"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
});

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fieldClassName =
    "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";
  const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0] ?? "Correo inválido");
      return;
    }

    if (parsed.data.email === currentEmail) {
      setError("Ese ya es tu correo actual.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      email: parsed.data.email,
    });

    if (updateError) {
      setError("No se pudo iniciar el cambio. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    setSuccess(true);
    setIsSaving(false);
    setEmail("");
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Correo actual: <span className="text-foreground">{currentEmail}</span>
      </p>

      {success ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
          Te enviamos un correo de confirmación a la nueva dirección. Da clic en
          el enlace ahí para completar el cambio.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error ? (
            <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="newEmail" className={labelClassName}>
              Nuevo correo
            </label>
            <input
              id="newEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClassName}
              disabled={isSaving}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
          >
            {isSaving ? "Enviando..." : "Cambiar correo"}
          </button>
        </form>
      )}
    </div>
  );
}
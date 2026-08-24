"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";
const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    const formData = new FormData(form);
    const parsed = schema.safeParse({
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setError(errors.password?.[0] ?? errors.confirmPassword?.[0] ?? "Datos inválidos");
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (updateError) {
      setError("No se pudo actualizar la contraseña.");
      setIsSaving(false);
      return;
    }

    setSuccess(true);
    setIsSaving(false);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {error ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
          Contraseña actualizada.
        </div>
      ) : null}

      <div>
        <label htmlFor="password" className={labelClassName}>
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={labelClassName}>
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md border border-black/15 px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
      >
        {isSaving ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
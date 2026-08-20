"use client";

import {
  AuthField,
  AuthLayout,
  formErrorClassName,
  inputClassName,
  submitButtonClassName,
} from "@/components/auth/AuthLayout";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setError(errors.password?.[0] ?? errors.confirmPassword?.[0] ?? "Datos inválidos");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (updateError) {
      setError("No se pudo actualizar. El link puede haber expirado, pide uno nuevo.");
      setIsLoading(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una nueva contraseña para tu cuenta"
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <div className={formErrorClassName}>{error}</div> : null}
        <AuthField id="password" label="Nueva contraseña">
          <input
            id="password"
            name="password"
            type="password"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>
        <AuthField id="confirmPassword" label="Confirmar contraseña">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>
        <button type="submit" disabled={isLoading} className={submitButtonClassName}>
          {isLoading ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>
    </AuthLayout>
  );
}
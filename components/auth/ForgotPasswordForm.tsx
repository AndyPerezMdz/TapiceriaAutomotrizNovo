"use client";

import {
  AuthField,
  AuthLayout,
  AuthLink,
  formErrorClassName,
  inputClassName,
  submitButtonClassName,
} from "@/components/auth/AuthLayout";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
});

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const parsed = schema.safeParse({ email: String(formData.get("email") ?? "") });

    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0] ?? "Correo inválido");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${window.location.origin}/auth/confirm?next=/actualizar-contrasena` },
    );

    if (resetError) {
      setError("No se pudo enviar el correo. Intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Te enviamos un enlace para restablecer tu contraseña"
        footer={<AuthLink href="/login">Volver a iniciar sesión</AuthLink>}
      >
        <p className="text-center text-sm text-muted">
          Si el correo existe en nuestro sistema, recibirás un enlace en unos minutos.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para restablecerla"
      footer={
        <>
          ¿Ya la recordaste? <AuthLink href="/login">Inicia sesión</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <div className={formErrorClassName}>{error}</div> : null}
        <AuthField id="email" label="Correo electrónico">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>
        <button type="submit" disabled={isLoading} className={submitButtonClassName}>
          {isLoading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </AuthLayout>
  );
}
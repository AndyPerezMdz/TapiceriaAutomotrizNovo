"use client";

import {
  AuthField,
  AuthLayout,
  AuthLink,
  formErrorClassName,
  inputClassName,
  submitButtonClassName,
} from "@/components/auth/AuthLayout";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debugReason = searchParams.get("reason");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof LoginFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setIsLoading(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Accede a tu portal de cliente"
      footer={
        <>
          ¿No tienes cuenta? <AuthLink href="/registro">Regístrate</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {debugReason ? (
          <div className="rounded-md border border-orange-500/30 bg-orange-500/5 px-3.5 py-2.5 text-xs text-orange-700 dark:text-orange-400">
            Debug: {debugReason}
          </div>
        ) : null}

        {formError ? (
          <div className={formErrorClassName}>{formError}</div>
        ) : null}

        <AuthField id="email" label="Correo electrónico" error={fieldErrors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>

        <AuthField id="password" label="Contraseña" error={fieldErrors.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>

        <div className="text-right">
          <AuthLink href="/recuperar">¿Olvidaste tu contraseña?</AuthLink>
        </div>

        <button type="submit" disabled={isLoading} className={submitButtonClassName}>
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>
    </AuthLayout>
  );
}
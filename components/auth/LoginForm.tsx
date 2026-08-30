"use client";

import {
  AuthField,
  AuthLayout,
  AuthLink,
  formErrorClassName,
  inputClassName,
  submitButtonClassName,
} from "@/components/auth/AuthLayout";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginMode = "password" | "magic";

export function LoginForm() {
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>("password");
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
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-black/15 p-1 dark:border-white/15">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`rounded-sm py-1.5 text-sm font-medium transition ${
            mode === "password"
              ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
              : "text-muted hover:text-foreground"
          }`}
        >
          Contraseña
        </button>
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`rounded-sm py-1.5 text-sm font-medium transition ${
            mode === "magic"
              ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
              : "text-muted hover:text-foreground"
          }`}
        >
          Sin contraseña
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
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
      ) : (
        <MagicLinkForm redirectPath="/portal" />
      )}
    </AuthLayout>
  );
}
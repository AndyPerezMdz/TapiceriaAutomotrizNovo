"use client";

import {
  AuthField,
  AuthLayout,
  AuthLink,
  formErrorClassName,
  inputClassName,
  secondaryButtonClassName,
  submitButtonClassName,
} from "@/components/auth/AuthLayout";
import { ShopHours } from "@/components/auth/ShopHours";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginMode = "password" | "magic";

interface LoginFormProps {
  hoursWeekday?: string;
  hoursSaturday?: string;
}

export function LoginForm({
  hoursWeekday = "9:30 am – 5:00 pm",
  hoursSaturday = "9:30 am – 3:00 pm",
}: LoginFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>("password");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof LoginFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    const formData = new FormData(form);
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
      title="Inicia sesión"
      subtitle="Revisa tus pedidos, cotizaciones y citas."
      footer={
        <>
          ¿Primera vez aquí? <AuthLink href="/registro">Crea tu cuenta</AuthLink>
        </>
      }
      panelExtra={<ShopHours hoursWeekday={hoursWeekday} hoursSaturday={hoursSaturday} />}
      mobileExtra={
        <ShopHours hoursWeekday={hoursWeekday} hoursSaturday={hoursSaturday} tone="light" />
      }
    >
      {mode === "password" ? (
        <>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError ? (
              <div role="alert" className={formErrorClassName}>
                {formError}
              </div>
            ) : null}

            <AuthField id="email" label="Correo electrónico" error={fieldErrors.email}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className={inputClassName}
                disabled={isLoading}
              />
            </AuthField>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <label htmlFor="password" className="text-[15px] font-semibold text-foreground">
                  Contraseña
                </label>
                <Link href="/recuperar" className="text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline">
                  ¿La olvidaste?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                className={inputClassName}
                disabled={isLoading}
              />
              {fieldErrors.password ? (
                <p className="mt-1.5 text-sm text-brand-red-dark dark:text-brand-red">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <button type="submit" disabled={isLoading} className={`${submitButtonClassName} !mt-6`}>
              {isLoading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <div className="flex-1 border-t-2 border-dashed border-seam" />
            <span className="text-sm text-muted">o</span>
            <div className="flex-1 border-t-2 border-dashed border-seam" />
          </div>

          <button type="button" onClick={() => setMode("magic")} className={secondaryButtonClassName}>
            Entrar con un enlace a mi correo
          </button>
        </>
      ) : (
        <>
          <p className="mb-4 text-[15px] text-muted">
            Te mandamos un enlace a tu correo; ábrelo desde este dispositivo y entras sin
            contraseña.
          </p>
          <MagicLinkForm redirectPath="/portal" />
          <button
            type="button"
            onClick={() => setMode("password")}
            className="mt-4 inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground underline-offset-4 hover:underline"
          >
            ← Usar mi contraseña
          </button>
        </>
      )}
    </AuthLayout>
  );
}

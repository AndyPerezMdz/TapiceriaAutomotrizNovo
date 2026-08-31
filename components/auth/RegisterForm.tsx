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
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formLoadedAt] = useState(() => Date.now());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    const honeypot = String(formData.get("company") ?? "");
    if (honeypot) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - formLoadedAt;
    if (elapsed < 3000) {
      setFormError("Ocurrió un problema. Intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setFormError("Debes aceptar los Términos y el Aviso de Privacidad para continuar.");
      setIsLoading(false);
      return;
    }

    const values = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const parsed = registerSchema.safeParse(values);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: errors.fullName?.[0],
        email: errors.email?.[0],
        phone: errors.phone?.[0],
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
        },
      },
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setIsLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError("Ya existe una cuenta con este correo. Intenta iniciar sesión.");
      setIsLoading(false);
      return;
    }

if (!data.session || !data.user) {
      setFormError(
        "Cuenta creada. Revisa tu correo para confirmar tu registro antes de iniciar sesión.",
      );
      setIsLoading(false);
      return;
    }

    if (refId) {
      await supabase.rpc("set_referred_by", { p_referred_by: refId });
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate como cliente de Tapicería Automotriz by NOVO"
      footer={
        <>
          ¿Ya tienes cuenta? <AuthLink href="/login">Inicia sesión</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? (
          <div className={formErrorClassName}>{formError}</div>
        ) : null}

        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label htmlFor="company">No llenar este campo</label>
          <input
            type="text"
            id="company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <AuthField id="fullName" label="Nombre completo" error={fieldErrors.fullName}>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>

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

        <AuthField id="phone" label="Teléfono (10 dígitos)" error={fieldErrors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="9999999999"
            autoComplete="tel"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>

        <AuthField id="password" label="Contraseña" error={fieldErrors.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>

        <AuthField
          id="confirmPassword"
          label="Confirmar contraseña"
          error={fieldErrors.confirmPassword}
        >
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            disabled={isLoading}
          />
        </AuthField>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <span>
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="underline hover:no-underline">
              Términos y Condiciones
            </Link>{" "}
            y el{" "}
            <Link href="/privacidad" target="_blank" className="underline hover:no-underline">
              Aviso de Privacidad
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !acceptedTerms}
          className={submitButtonClassName}
        >
          {isLoading ? "Creando cuenta..." : "Registrarse"}
        </button>
      </form>
    </AuthLayout>
  );
}
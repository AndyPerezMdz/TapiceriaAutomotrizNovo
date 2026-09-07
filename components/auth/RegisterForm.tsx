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
import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function StyledCheckbox({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
      <span className="relative mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer absolute h-[18px] w-[18px] cursor-pointer appearance-none rounded border border-black/25 transition checked:border-brand-yellow checked:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/25"
        />
        <Check
          size={12}
          strokeWidth={3}
          className="pointer-events-none absolute text-brand-black opacity-0 transition peer-checked:opacity-100"
        />
      </span>
      <span className="leading-snug">{children}</span>
    </label>
  );
}

function PasswordInput({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        className={`${inputClassName} pr-10`}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-foreground"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [wantsMarketing, setWantsMarketing] = useState(false);
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

    if (refId) {
      try {
        localStorage.setItem("pending_referral", refId);
      } catch {
        // localStorage puede fallar en modo incógnito estricto; no es crítico.
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          marketing_opt_in: wantsMarketing,
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
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="password" label="Contraseña" error={fieldErrors.password}>
            <PasswordInput id="password" name="password" disabled={isLoading} />
          </AuthField>

          <AuthField
            id="confirmPassword"
            label="Confirmar contraseña"
            error={fieldErrors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              disabled={isLoading}
            />
          </AuthField>
        </div>

        <div className="space-y-3 rounded-lg border border-black/10 bg-surface/50 p-4 dark:border-white/10">
          <StyledCheckbox
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            disabled={isLoading}
          >
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="underline hover:no-underline">
              Términos y Condiciones
            </Link>{" "}
            y el{" "}
            <Link href="/privacidad" target="_blank" className="underline hover:no-underline">
              Aviso de Privacidad
            </Link>
            .
          </StyledCheckbox>

          <StyledCheckbox
            checked={wantsMarketing}
            onChange={setWantsMarketing}
            disabled={isLoading}
          >
            Quiero recibir correos sobre promociones, cupones nuevos y novedades
            <span className="text-muted"> (opcional).</span>
          </StyledCheckbox>
        </div>

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
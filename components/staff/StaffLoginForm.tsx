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
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginMode = "password" | "magic";

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
        autoComplete="current-password"
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

export function StaffLoginForm() {
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role === "cliente") {
      await supabase.auth.signOut();
      setFormError("Esta cuenta no tiene acceso al panel de staff.");
      setIsLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Panel de staff"
      subtitle="Acceso exclusivo para personal del taller"
      footer={
        <>
          <ShieldCheck size={13} className="inline align-text-bottom" /> Acceso interno —
          si no trabajas en el taller, esta pantalla no es para ti.
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
            <PasswordInput id="password" name="password" disabled={isLoading} />
          </AuthField>

          <div className="text-right">
            <AuthLink href="/staff/recuperar">¿Olvidaste tu contraseña?</AuthLink>
          </div>

          <button type="submit" disabled={isLoading} className={submitButtonClassName}>
            {isLoading ? "Verificando..." : "Iniciar sesión"}
          </button>
        </form>
      ) : (
        <MagicLinkForm redirectPath="/admin" />
      )}
    </AuthLayout>
  );
}
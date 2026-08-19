"use client";

import { BrandLogo } from "@/components/auth/BrandLogo";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Link } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15 dark:focus:border-white dark:focus:ring-white";

export function StaffLoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
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
    <main className="flex min-h-screen items-center justify-center bg-brand-black px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-surface p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>

        <div className="mb-7 text-center">
          <span className="mb-3 inline-block rounded-full bg-brand-yellow/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-yellow-dark dark:text-brand-yellow">
            Acceso interno
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel de staff
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Acceso exclusivo para personal del taller
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
              {formError}
            </div>
          ) : null}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={fieldClassName}
              disabled={isLoading}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-sm text-brand-red">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={fieldClassName}
              disabled={isLoading}
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-sm text-brand-red">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="text-right">
            <Link href="/recuperar" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-brand-black"
          >
            {isLoading ? "Verificando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
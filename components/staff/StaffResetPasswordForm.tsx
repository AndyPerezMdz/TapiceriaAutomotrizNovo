"use client";

import { BrandLogo } from "@/components/auth/BrandLogo";
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

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

export function StaffResetPasswordForm() {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nueva contraseña
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Elige una nueva contraseña para tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={fieldClassName}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-foreground">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className={fieldClassName}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
          >
            {isLoading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}
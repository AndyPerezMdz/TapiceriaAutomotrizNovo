"use client";

import { BrandLogo } from "@/components/auth/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
});

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

export function StaffForgotPasswordForm() {
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
      {
        redirectTo: `${window.location.origin}/auth/confirm?next=/staff/actualizar-contrasena`,
      },
    );

    if (resetError) {
      setError("No se pudo enviar el correo. Intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-black px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-surface p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>

        {success ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Revisa tu correo
            </h1>
            <p className="mt-2 text-sm text-muted">
              Si el correo existe en nuestro sistema, recibirás un enlace en unos minutos.
            </p>
            <Link
              href="/staff/login"
              className="mt-6 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Recuperar contraseña
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Acceso exclusivo para personal del taller
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
                  {error}
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
                  className={fieldClassName}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
              >
                {isLoading ? "Enviando..." : "Enviar enlace"}
              </button>

              <Link
                href="/staff/login"
                className="block text-center text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
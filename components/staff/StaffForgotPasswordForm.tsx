"use client";

import {
  StaffAuthShell,
  staffButtonClass,
  staffErrorClass,
  staffFieldClass,
  staffLabelClass,
} from "@/components/staff/StaffAuthShell";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
});

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

  const back = (
    <Link href="/staff/login" className="font-semibold text-brand-yellow underline-offset-4 hover:underline">
      Volver a iniciar sesión
    </Link>
  );

  if (success) {
    return (
      <StaffAuthShell eyebrow="Acceso del equipo" title="Revisa tu correo" footer={back}>
        <p className="text-base leading-relaxed text-[#d9d5cc]">
          Si el correo está dado de alta en el taller, te llega un enlace en unos minutos para elegir una contraseña nueva.
        </p>
        <div className="mt-5 border-t-2 border-dashed border-[#3d3b36]" />
        <p className="mt-4 text-sm text-on-ink-muted">¿No llega? Revisa spam o pídele al administrador que te reenvíe la invitación.</p>
      </StaffAuthShell>
    );
  }

  return (
    <StaffAuthShell eyebrow="Acceso del equipo" title="Recuperar contraseña" footer={back}>
      <p className="text-base text-[#d9d5cc]">Escribe tu correo del taller y te mandamos un enlace.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        {error ? (
          <div role="alert" className={staffErrorClass}>
            {error}
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className={staffLabelClass}>
            Correo electrónico
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className={staffFieldClass} disabled={isLoading} />
        </div>
        <button type="submit" disabled={isLoading} className={`!mt-6 ${staffButtonClass}`}>
          {isLoading ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>
    </StaffAuthShell>
  );
}

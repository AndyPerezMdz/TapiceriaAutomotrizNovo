"use client";

import {
  StaffAuthShell,
  staffButtonClass,
  staffErrorClass,
  staffFieldClass,
  staffLabelClass,
} from "@/components/staff/StaffAuthShell";
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
    <StaffAuthShell
      eyebrow="Acceso del equipo"
      title="Nueva contraseña"
      footer="Al guardarla entras directo al panel."
    >
      <p className="text-base text-[#d9d5cc]">Elige una contraseña nueva para tu cuenta.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        {error ? (
          <div role="alert" className={staffErrorClass}>
            {error}
          </div>
        ) : null}
        <div>
          <label htmlFor="password" className={staffLabelClass}>
            Nueva contraseña
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" className={staffFieldClass} disabled={isLoading} />
          <p className="mt-1.5 text-[13px] text-on-ink-muted">Mínimo 8 caracteres</p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className={staffLabelClass}>
            Confírmala
          </label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className={staffFieldClass} disabled={isLoading} />
        </div>
        <button type="submit" disabled={isLoading} className={`!mt-6 ${staffButtonClass}`}>
          {isLoading ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </StaffAuthShell>
  );
}

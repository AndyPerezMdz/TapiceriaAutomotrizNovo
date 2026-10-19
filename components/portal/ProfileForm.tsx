"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre"),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, {
      message: "Ingresa un teléfono a 10 dígitos",
    }),
});

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";
const labelClassName = "mb-1.5 block text-[15px] font-medium text-foreground";

export function ProfileForm({
  email,
  fullName,
  phone,
}: {
  email: string;
  fullName: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const parsed = profileSchema.safeParse({
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setError(errors.fullName?.[0] ?? errors.phone?.[0] ?? "Datos inválidos");
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró. Inicia sesión de nuevo.");
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
      .eq("id", user.id);

    if (updateError) {
      setError("No se pudo guardar. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    setSuccess(true);
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {error ? (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-[15px] text-brand-red">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-[15px] text-green-700 dark:text-green-400">
          Datos actualizados correctamente.
        </div>
      ) : null}

      <div>
        <label className={labelClassName}>Correo electrónico</label>
        <input
          value={email}
          disabled
          className={`${fieldClassName} cursor-not-allowed opacity-60`}
        />
      </div>

      <div>
        <label htmlFor="fullName" className={labelClassName}>
          Nombre completo
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div>
        <label htmlFor="phone" className={labelClassName}>
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={phone ?? ""}
          inputMode="numeric"
          placeholder="9999999999"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
      >
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
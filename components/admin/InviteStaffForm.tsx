"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";
const labelClassName = "mb-1.5 block text-[15px] font-medium text-foreground";

export function InviteStaffForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      role: String(formData.get("role") ?? "empleado"),
    };

    const res = await fetch("/api/admin/invite-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No se pudo enviar la invitación.");
      setIsSaving(false);
      return;
    }

    setSuccess(true);
    setIsSaving(false);
    form.reset();
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
          Invitación enviada. La persona recibirá un correo para crear su contraseña.
        </div>
      ) : null}

      <div>
        <label htmlFor="fullName" className={labelClassName}>
          Nombre completo
        </label>
        <input id="fullName" name="fullName" className={fieldClassName} disabled={isSaving} />
      </div>

      <div>
        <label htmlFor="email" className={labelClassName}>
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <div>
        <label htmlFor="role" className={labelClassName}>
          Rol
        </label>
        <select id="role" name="role" className={fieldClassName} disabled={isSaving}>
          <option value="empleado">Empleado</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
      >
        {isSaving ? "Enviando..." : "Enviar invitación"}
      </button>
    </form>
  );
}
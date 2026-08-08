"use client";

import { createClient } from "@/lib/supabase/client";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { useState } from "react";

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15 dark:focus:border-white dark:focus:ring-white";

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

export function ContactForm() {
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof ContactFormData, string>>
  >({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFieldErrors({});
    setStatus("loading");

    const formData = new FormData(form);
    const values = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    const parsed = contactSchema.safeParse(values);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        phone: errors.phone?.[0],
        message: errors.message?.[0],
      });
      setStatus("idle");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      message: parsed.data.message,
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("success");
    form.reset();
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-6 text-center">
        <p className="font-semibold text-foreground">¡Mensaje enviado!</p>
        <p className="mt-1 text-sm text-muted">
          Te contactaremos pronto por teléfono o WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          Hubo un problema al enviar tu mensaje. Intenta de nuevo.
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className={labelClassName}>
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className={fieldClassName}
          disabled={status === "loading"}
        />
        {fieldErrors.name ? (
          <p className="mt-1 text-sm text-brand-red">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className={labelClassName}>
          Teléfono (10 dígitos)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="9999999999"
          className={fieldClassName}
          disabled={status === "loading"}
        />
        {fieldErrors.phone ? (
          <p className="mt-1 text-sm text-brand-red">{fieldErrors.phone}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className={labelClassName}>
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Cuéntanos qué necesitas..."
          className={fieldClassName}
          disabled={status === "loading"}
        />
        {fieldErrors.message ? (
          <p className="mt-1 text-sm text-brand-red">{fieldErrors.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-brand-black dark:hover:bg-white/85"
      >
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
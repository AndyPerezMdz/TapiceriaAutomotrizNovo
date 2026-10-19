"use client";

import { createClient } from "@/lib/supabase/client";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { useState } from "react";

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";

const labelClassName = "mb-1.5 block text-[15px] font-semibold text-foreground";

export function ContactForm() {
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof ContactFormData, string>>
  >({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [formLoadedAt] = useState(() => Date.now());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFieldErrors({});
    setStatus("loading");

    const formData = new FormData(form);

    // Honeypot: campo invisible que solo un bot llenaría
    const honeypot = String(formData.get("company") ?? "");
    if (honeypot) {
      // Fingimos éxito sin guardar nada, para no delatar la trampa al bot
      setStatus("success");
      return;
    }

    // Trampa de tiempo: menos de 3 segundos es sospechosamente rápido
    const elapsed = Date.now() - formLoadedAt;
    if (elapsed < 3000) {
      setStatus("error");
      return;
    }

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
      <div className="rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 bg-highlight p-6 text-center">
        <p className="font-display text-3xl font-extrabold uppercase text-foreground">¡Mensaje enviado!</p>
        <p className="mt-1 text-[15px] text-muted">
          Te contactaremos pronto por teléfono o WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" ? (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-[15px] text-brand-red">
          Hubo un problema al enviar tu mensaje. Intenta de nuevo.
        </div>
      ) : null}

      {/* Honeypot: invisible para humanos, tentador para bots */}
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
          <p className="mt-1 text-[15px] text-brand-red">{fieldErrors.name}</p>
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
          <p className="mt-1 text-[15px] text-brand-red">{fieldErrors.phone}</p>
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
          placeholder="Ej. Quiero cotizar el forro del volante de mi Jetta 2015."
          className={fieldClassName}
          disabled={status === "loading"}
        />
        {fieldErrors.message ? (
          <p className="mt-1 text-[15px] text-brand-red">{fieldErrors.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand-yellow px-6 text-[17px] font-bold text-ink transition hover:bg-[#e8b90f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
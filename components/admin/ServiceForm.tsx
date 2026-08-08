"use client";

import { createClient } from "@/lib/supabase/client";
import { serviceSchema, type ServiceFormData } from "@/lib/validations/service";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

interface ExistingService {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  is_active: boolean;
}

export function ServiceForm({ service }: { service?: ExistingService }) {
  const router = useRouter();
  const isEditing = Boolean(service);

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ServiceFormData, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const values = {
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      shortDescription: String(formData.get("shortDescription") ?? ""),
      fullDescription: String(formData.get("fullDescription") ?? ""),
      isActive: formData.get("isActive") === "on",
    };

    const parsed = serviceSchema.safeParse(values);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        title: errors.title?.[0],
        slug: errors.slug?.[0],
        shortDescription: errors.shortDescription?.[0],
        fullDescription: errors.fullDescription?.[0],
      });
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const payload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      short_description: parsed.data.shortDescription,
      full_description: parsed.data.fullDescription,
      is_active: parsed.data.isActive,
    };

    const { error } = isEditing
      ? await supabase.from("services").update(payload).eq("id", service!.id)
      : await supabase.from("services").insert(payload);

    if (error) {
      setFormError(
        error.message.includes("duplicate")
          ? "Ya existe un servicio con ese identificador (slug)."
          : "No se pudo guardar. Intenta de nuevo.",
      );
      setIsSaving(false);
      return;
    }

    router.push("/admin/servicios");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {formError ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {formError}
        </div>
      ) : null}

      <div>
        <label htmlFor="title" className={labelClassName}>
          Nombre del servicio
        </label>
        <input
          id="title"
          name="title"
          defaultValue={service?.title}
          onChange={(e) => {
            if (!isEditing) {
              const slugInput = document.getElementById("slug") as HTMLInputElement;
              if (slugInput && !slugInput.dataset.touched) {
                slugInput.value = slugify(e.target.value);
              }
            }
          }}
          className={fieldClassName}
          disabled={isSaving}
        />
        {fieldErrors.title ? (
          <p className="mt-1 text-sm text-brand-red">{fieldErrors.title}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="slug" className={labelClassName}>
          Identificador de URL (slug)
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={service?.slug}
          onInput={(e) => {
            (e.target as HTMLInputElement).dataset.touched = "true";
          }}
          placeholder="ej. tapizado-asientos"
          className={fieldClassName}
          disabled={isSaving}
        />
        <p className="mt-1 text-xs text-muted">
          Se genera solo, pero puedes editarlo. Aparecerá en la URL: /servicios/tu-slug
        </p>
        {fieldErrors.slug ? (
          <p className="mt-1 text-sm text-brand-red">{fieldErrors.slug}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="shortDescription" className={labelClassName}>
          Descripción corta (aparece en tarjetas)
        </label>
        <input
          id="shortDescription"
          name="shortDescription"
          defaultValue={service?.short_description}
          className={fieldClassName}
          disabled={isSaving}
        />
        {fieldErrors.shortDescription ? (
          <p className="mt-1 text-sm text-brand-red">{fieldErrors.shortDescription}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="fullDescription" className={labelClassName}>
          Descripción completa (aparece en el detalle)
        </label>
        <textarea
          id="fullDescription"
          name="fullDescription"
          rows={5}
          defaultValue={service?.full_description}
          className={fieldClassName}
          disabled={isSaving}
        />
        {fieldErrors.fullDescription ? (
          <p className="mt-1 text-sm text-brand-red">{fieldErrors.fullDescription}</p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={service?.is_active ?? true}
          disabled={isSaving}
        />
        Servicio activo (visible en el sitio)
      </label>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear servicio"}
      </button>
    </form>
  );
}
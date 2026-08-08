"use client";

import { createClient } from "@/lib/supabase/client";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Service {
  id: string;
  title: string;
}

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";
const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

export function GalleryItemForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [caption, setCaption] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError.message);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("gallery").getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!beforeFile && !afterFile) {
      setError("Sube al menos una foto (antes o después).");
      return;
    }

    setIsSaving(true);

    const beforeUrl = beforeFile ? await uploadImage(beforeFile) : null;
    const afterUrl = afterFile ? await uploadImage(afterFile) : null;

    if ((beforeFile && !beforeUrl) || (afterFile && !afterUrl)) {
      setError("No se pudo subir alguna de las imágenes. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("gallery_items").insert({
      service_id: serviceId || null,
      image_before_url: beforeUrl,
      image_after_url: afterUrl,
      caption: caption || null,
    });

    if (insertError) {
      setError("No se pudo guardar. Intenta de nuevo.");
      setIsSaving(false);
      return;
    }

    router.push("/admin/galeria");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      <div>
        <label className={labelClassName}>Servicio relacionado (opcional)</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className={fieldClassName}
          disabled={isSaving}
        >
          <option value="">Sin servicio específico</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Foto &quot;Antes&quot;</label>
          <PhotoPicker file={beforeFile} onChange={setBeforeFile} disabled={isSaving} />
        </div>
        <div>
          <label className={labelClassName}>Foto &quot;Después&quot;</label>
          <PhotoPicker file={afterFile} onChange={setAfterFile} disabled={isSaving} />
        </div>
      </div>

      <div>
        <label className={labelClassName}>Descripción (opcional)</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Ej. Asientos delanteros, piel color negro"
          className={fieldClassName}
          disabled={isSaving}
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSaving ? "Guardando..." : "Agregar a galería"}
      </button>
    </form>
  );
}

function PhotoPicker({
  file,
  onChange,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-black/20 text-muted transition hover:border-black/40 dark:border-white/20">
      {file ? (
        <img
          src={URL.createObjectURL(file)}
          alt=""
          className="h-full w-full rounded-md object-cover"
        />
      ) : (
        <>
          <ImagePlus size={24} />
          <span className="text-xs">Subir foto</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
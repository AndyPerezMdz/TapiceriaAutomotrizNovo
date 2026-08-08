"use client";

import { ServiceMaterialSelector } from "@/components/portal/ServiceMaterialSelector";
import { createClient } from "@/lib/supabase/client";
import { newOrderSchema, type NewOrderFormData } from "@/lib/validations/order";
import { ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15 dark:focus:border-white dark:focus:ring-white";

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_MB = 5;

interface Service {
  id: string;
  slug: string;
  title: string;
}

export function NewOrderForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const [selection, setSelection] = useState<{
    serviceId: string | null;
    materialTypeId: string | null;
    materialColorId: string | null;
  }>({ serviceId: null, materialTypeId: null, materialColorId: null });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof NewOrderFormData, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setPhotoError(null);

    if (photos.length + files.length > MAX_PHOTOS) {
      setPhotoError(`Puedes subir un máximo de ${MAX_PHOTOS} fotos.`);
      return;
    }

    const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      setPhotoError(`Cada foto debe pesar menos de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const notImage = files.find((f) => !f.type.startsWith("image/"));
    if (notImage) {
      setPhotoError("Solo se permiten archivos de imagen.");
      return;
    }

    setPhotos((prev) => [...prev, ...files]);
    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const values = {
      serviceId: selection.serviceId ?? "",
      vehicleMake: String(formData.get("vehicleMake") ?? ""),
      vehicleModel: String(formData.get("vehicleModel") ?? ""),
      vehicleYear: String(formData.get("vehicleYear") ?? ""),
      serviceDescription: String(formData.get("serviceDescription") ?? ""),
    };

    const parsed = newOrderSchema.safeParse(values);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        serviceId: errors.serviceId?.[0],
        vehicleMake: errors.vehicleMake?.[0],
        vehicleModel: errors.vehicleModel?.[0],
        vehicleYear: errors.vehicleYear?.[0],
        serviceDescription: errors.serviceDescription?.[0],
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormError("Tu sesión expiró. Inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        client_id: user.id,
        vehicle_make: parsed.data.vehicleMake,
        vehicle_model: parsed.data.vehicleModel,
        vehicle_year: Number(parsed.data.vehicleYear),
        service_description: parsed.data.serviceDescription,
        material_type_id: selection.materialTypeId,
        material_color_id: selection.materialColorId,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setFormError("No se pudo crear el pedido. Intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    for (const photo of photos) {
      const fileExt = photo.name.split(".").pop();
      const filePath = `${order.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("order-photos")
        .upload(filePath, photo);

      if (uploadError) {
        console.error("Error subiendo foto:", uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("order-photos").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("order_photos").insert({
        order_id: order.id,
        url: publicUrl,
        uploaded_by: user.id,
      });

      if (insertError) {
        console.error("Error guardando foto en base de datos:", insertError.message);
      }
    }

    router.push(`/portal/pedidos/${order.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {formError}
        </div>
      ) : null}

      <ServiceMaterialSelector services={services} onSelectionChange={setSelection} />
      {fieldErrors.serviceId ? (
        <p className="text-sm text-brand-red">{fieldErrors.serviceId}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="vehicleMake" className={labelClassName}>
            Marca
          </label>
          <input
            id="vehicleMake"
            name="vehicleMake"
            placeholder="Nissan"
            className={fieldClassName}
            disabled={isLoading}
          />
          {fieldErrors.vehicleMake ? (
            <p className="mt-1 text-sm text-brand-red">{fieldErrors.vehicleMake}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="vehicleModel" className={labelClassName}>
            Modelo
          </label>
          <input
            id="vehicleModel"
            name="vehicleModel"
            placeholder="Versa"
            className={fieldClassName}
            disabled={isLoading}
          />
          {fieldErrors.vehicleModel ? (
            <p className="mt-1 text-sm text-brand-red">{fieldErrors.vehicleModel}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="vehicleYear" className={labelClassName}>
            Año
          </label>
          <input
            id="vehicleYear"
            name="vehicleYear"
            inputMode="numeric"
            placeholder="2020"
            className={fieldClassName}
            disabled={isLoading}
          />
          {fieldErrors.vehicleYear ? (
            <p className="mt-1 text-sm text-brand-red">{fieldErrors.vehicleYear}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="serviceDescription" className={labelClassName}>
          Detalles adicionales
        </label>
        <textarea
          id="serviceDescription"
          name="serviceDescription"
          rows={4}
          placeholder="Cuéntanos cualquier detalle extra que debamos saber..."
          className={fieldClassName}
          disabled={isLoading}
        />
        {fieldErrors.serviceDescription ? (
          <p className="mt-1 text-sm text-brand-red">
            {fieldErrors.serviceDescription}
          </p>
        ) : null}
      </div>

      <div>
        <label className={labelClassName}>Fotos (opcional, máx. {MAX_PHOTOS})</label>

        <div className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative h-20 w-20 overflow-hidden rounded-md border border-black/10 dark:border-white/10"
            >
              <img
                src={URL.createObjectURL(photo)}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS ? (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-black/20 text-muted transition hover:border-black/40 dark:border-white/20">
              <ImagePlus size={20} />
              <span className="text-[10px]">Agregar</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoChange}
                disabled={isLoading}
              />
            </label>
          ) : null}
        </div>

        {photoError ? (
          <p className="mt-2 text-sm text-brand-red">{photoError}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-brand-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-brand-black dark:hover:bg-white/85 sm:w-auto"
      >
        {isLoading ? "Enviando pedido..." : "Solicitar cotización"}
      </button>
    </form>
  );
}
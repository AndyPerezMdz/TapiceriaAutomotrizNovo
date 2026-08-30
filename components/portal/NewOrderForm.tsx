"use client";

import {
  ServiceMaterialSelector,
  type MaterialSelection,
} from "@/components/portal/ServiceMaterialSelector";
import { CouponSelector } from "@/components/portal/CouponSelector";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { createClient } from "@/lib/supabase/client";
import { newOrderSchema, type NewOrderFormData } from "@/lib/validations/order";
import {
  Car,
  Check,
  ImagePlus,
  MessageCircle,
  Palette,
  Wrench,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

const emptySelection: MaterialSelection = {
  serviceId: null,
  serviceName: null,
  materialTypeId: null,
  materialName: null,
  materialColorId: null,
  colorName: null,
  priceHint: null,
  requiresVisit: false,
};

export function NewOrderForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repeatOrderId = searchParams.get("repeat");

  const [selection, setSelection] = useState<MaterialSelection>(emptySelection);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [description, setDescription] = useState("");

  const [initialValues, setInitialValues] = useState<{
    serviceId?: string;
    materialTypeId?: string;
    materialColorId?: string;
  } | null>(null);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof NewOrderFormData, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("business_settings")
      .select("whatsapp")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setWhatsappNumber(data.whatsapp);
      });
  }, []);

  useEffect(() => {
    if (!repeatOrderId) {
      setInitialValues({});
      return;
    }

    const supabase = createClient();
    supabase
      .from("orders")
      .select(
        "vehicle_make, vehicle_model, vehicle_year, service_id, material_type_id, material_color_id",
      )
      .eq("id", repeatOrderId)
      .single()
      .then(({ data }) => {
        if (data) {
          setVehicleMake(data.vehicle_make ?? "");
          setVehicleModel(data.vehicle_model ?? "");
          setVehicleYear(data.vehicle_year ? String(data.vehicle_year) : "");
          setInitialValues({
            serviceId: data.service_id ?? undefined,
            materialTypeId: data.material_type_id ?? undefined,
            materialColorId: data.material_color_id ?? undefined,
          });
        } else {
          setInitialValues({});
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatOrderId]);

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

    const values = {
      serviceId: selection.serviceId ?? "",
      vehicleMake,
      vehicleModel,
      vehicleYear,
      serviceDescription: description,
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
        service_id: selection.serviceId,
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

    if (selectedCouponId) {
      await supabase.rpc("apply_coupon_to_order", {
        p_coupon_id: selectedCouponId,
        p_order_id: order.id,
      });
    }

    for (const photo of photos) {
      const fileExt = photo.name.split(".").pop();
      const filePath = `${order.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("order-photos")
        .upload(filePath, photo);

      if (uploadError) continue;

      const {
        data: { publicUrl },
      } = supabase.storage.from("order-photos").getPublicUrl(filePath);

      await supabase.from("order_photos").insert({
        order_id: order.id,
        url: publicUrl,
        uploaded_by: user.id,
      });
    }

    fetch("/api/notify/new-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    }).catch(() => {});

    router.push(`/portal/pedidos/${order.id}`);
    router.refresh();
  }

  const vehicleSummary = [vehicleMake, vehicleModel, vehicleYear].filter(Boolean).join(" ");

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
        {formError ? (
          <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
            {formError}
          </div>
        ) : null}

        <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Wrench size={16} /> Servicio y material
          </h2>
          {initialValues !== null ? (
            <ServiceMaterialSelector
              services={services}
              onSelectionChange={setSelection}
              initialServiceId={initialValues.serviceId}
              initialMaterialTypeId={initialValues.materialTypeId}
              initialMaterialColorId={initialValues.materialColorId}
            />
          ) : (
            <p className="text-sm text-muted">Cargando...</p>
          )}
          {fieldErrors.serviceId ? (
            <p className="mt-2 text-sm text-brand-red">{fieldErrors.serviceId}</p>
          ) : null}
        </div>

        {selection.requiresVisit ? (
          <div className="rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-5">
            <p className="font-medium text-foreground">
              Este color necesita una visita al taller
            </p>
            <p className="mt-1 text-sm text-muted">
              Para colores de piel distintos al negro de fábrica, necesitamos
              tomar una muestra de tu asiento para igualar el tono exacto.
              Agenda tu visita en línea, o contáctanos por WhatsApp.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/portal/agendar-cita"
                className="flex w-fit items-center gap-2 rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
              >
                Agendar visita en línea
              </a>
              <a
                href={
                  whatsappNumber
                    ? buildWhatsAppLink(
                        "Hola, quiero agendar una visita al taller para cotizar un color de piel personalizado.",
                        whatsappNumber,
                      )
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 rounded-md border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/20"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Car size={16} /> Tu vehículo
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="vehicleMake" className={labelClassName}>
                    Marca
                  </label>
                  <input
                    id="vehicleMake"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
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
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
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
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
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

              <div className="mt-4">
                <label htmlFor="serviceDescription" className={labelClassName}>
                  Detalles adicionales
                </label>
                <textarea
                  id="serviceDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
            </div>

            <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <ImagePlus size={16} /> Fotos (opcional, máx. {MAX_PHOTOS})
              </h2>

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
          </>
        )}
      </form>

      {/* Resumen en vivo + cupón */}
      <div className="min-w-0 space-y-6">
        <div className="sticky top-6 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Resumen de tu solicitud
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Wrench size={15} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-xs text-muted">Servicio</p>
                <p className="text-foreground">
                  {selection.serviceName ?? "Sin elegir todavía"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Palette size={15} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-xs text-muted">Material y color</p>
                <p className="text-foreground">
                  {selection.materialName
                    ? `${selection.materialName}${selection.colorName ? ` · ${selection.colorName}` : ""}`
                    : "Sin elegir todavía"}
                </p>
                {selection.priceHint ? (
                  <p className="text-xs text-muted">{selection.priceHint}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Car size={15} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-xs text-muted">Vehículo</p>
                <p className="text-foreground">
                  {vehicleSummary || "Sin capturar todavía"}
                </p>
              </div>
            </div>

            {selectedCouponId ? (
              <div className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-brand-yellow-dark dark:text-brand-yellow" />
                <div>
                  <p className="text-xs text-muted">Cupón</p>
                  <p className="text-foreground">Aplicado ✓</p>
                </div>
              </div>
            ) : null}

            {photos.length > 0 ? (
              <div className="flex items-start gap-2">
                <ImagePlus size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="text-xs text-muted">Fotos adjuntas</p>
                  <p className="text-foreground">{photos.length} foto(s)</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Check size={13} className="text-brand-yellow-dark dark:text-brand-yellow" />
              Un miembro de nuestro equipo revisará tu solicitud y te enviará un
              precio estimado antes de iniciar cualquier trabajo.
            </p>
          </div>
        </div>

        {!selection.requiresVisit ? (
          <CouponSelector
            serviceId={selection.serviceId}
            selectedCouponId={selectedCouponId}
            onSelect={setSelectedCouponId}
          />
        ) : null}
      </div>
    </div>
  );
}